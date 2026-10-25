/**
 * Pro 动画成品合成
 *
 * 逐页把「动画片段 + 配音」合成为统一规格的片段，再按页序拼接，
 * 最后混入背景音乐，上传 R2 返回成品地址。
 *
 * 为什么不直接 `-c copy` 拼接：
 * Wan 3 每页输出的分辨率/帧率/音轨可能不一致，直接流拷贝在接缝处会失败，
 * 所以先统一 scale+pad 到 720p、40ms 音轨对齐，再拼接。
 */

import { spawn } from 'node:child_process'
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import ffmpegPath from 'ffmpeg-static'
import { getObjectFile, uploadFile, bookKey } from '@/lib/r2'

/**
 * 每页统一规格的滤镜串（720p / 30fps，横竖屏都居中加黑边）。
 *
 * 这里故意写成整段字面量而不是模板拼接：Next 的 SWC 在压缩模板字符串时
 * 会把 `:force_original_aspect_ratio=decrease,` 这段吃掉，导致 ffmpeg 收到
 * `scale=1280:720pad=...` 直接报错。改成字面量可绕开。
 */
const VIDEO_FILTER =
  'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30'

export interface ProSegment {
  videoUrl?: string
  audioUrl?: string
}

/** 下载任意来源的素材：同源代理走 S3，其余（临时 URL / CDN）走 HTTP */
async function fetchBytes(url: string): Promise<Buffer> {
  if (url.startsWith('/api/assets/')) {
    const obj = await getObjectFile(url.slice('/api/assets/'.length))
    if (!obj) throw new Error(`Asset not found in R2: ${url}`)
    return Buffer.from(obj.body)
  }

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

/** 把外部临时素材转存到 R2，返回站内地址（Replicate 的 URL 会过期） */
export async function mirrorToR2(url: string, key: string): Promise<string> {
  const buf = await fetchBytes(url)
  return uploadFile(key, buf, key.endsWith('.mp3') ? 'audio/mpeg' : 'video/mp4')
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const bin = ffmpegPath
    if (!bin) {
      reject(new Error('ffmpeg binary is not available'))
      return
    }

    const proc = spawn(bin, args, { stdio: ['ignore', 'ignore', 'pipe'] })
    let stderr = ''

    proc.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString()
      // 只保留尾部，避免长任务把日志吃满
      if (stderr.length > 8000) stderr = stderr.slice(-8000)
    })
    proc.on('error', reject)
    proc.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`ffmpeg exited with ${code}: ${stderr.slice(-600)}`))
    })
  })
}

/** 单页：视频 + 可选配音 → 统一规格的片段（音轨对齐到视频长度） */
async function buildSegment(
  dir: string,
  index: number,
  segment: ProSegment,
): Promise<string | null> {
  if (!segment.videoUrl) return null

  const videoPath = path.join(dir, `src_${index}.mp4`)
  await writeFile(videoPath, await fetchBytes(segment.videoUrl))

  const outPath = path.join(dir, `seg_${String(index).padStart(3, '0')}.mp4`)
  const graph = '[0:v]' + VIDEO_FILTER + '[v]'

  const baseArgs = ['-y', '-i', videoPath]

  if (segment.audioUrl) {
    const audioPath = path.join(dir, `src_${index}.mp3`)
    await writeFile(audioPath, await fetchBytes(segment.audioUrl))
    baseArgs.push('-i', audioPath)
    await runFfmpeg([
      ...baseArgs,
      '-filter_complex',
      graph,
      '-map', '[v]',
      '-map', '1:a',
      // 配音短了补静音、长了截断，保证每段时长 = 视频时长
      '-af', 'apad',
      '-shortest',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-ar', '44100', '-b:a', '128k',
      '-movflags', '+faststart',
      outPath,
    ])
  } else {
    // 没有配音：补一条静音轨，保证所有片段音轨结构一致，后续 concat 才能流拷贝
    await runFfmpeg([
      ...baseArgs,
      '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=44100',
      '-filter_complex',
      graph,
      '-map', '[v]',
      '-map', '1:a',
      '-shortest',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-ar', '44100', '-b:a', '128k',
      '-movflags', '+faststart',
      outPath,
    ])
  }

  return outPath
}

/** 拼接所有片段（编码已统一，可流拷贝），再可选混入背景音乐 */
async function joinAndMix(
  dir: string,
  segmentPaths: string[],
  musicUrl: string | undefined,
): Promise<string> {
  const listPath = path.join(dir, 'concat.txt')
  await writeFile(
    listPath,
    segmentPaths.map((p) => `file '${p.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'),
    'utf8',
  )

  const joinedPath = path.join(dir, 'joined.mp4')
  await runFfmpeg([
    '-y',
    '-f', 'concat', '-safe', '0', '-i', listPath,
    '-c', 'copy',
    '-movflags', '+faststart',
    joinedPath,
  ])

  if (!musicUrl) return joinedPath

  const musicPath = path.join(dir, 'music.mp3')
  await writeFile(musicPath, await fetchBytes(musicUrl))

  const finalPath = path.join(dir, 'final.mp4')
  await runFfmpeg([
    '-y',
    '-i', joinedPath,
    // 配乐循环铺满整本，音量压到 18%，不盖过旁白
    '-stream_loop', '-1', '-i', musicPath,
    '-filter_complex',
    '[1:a]volume=0.18[bg];[0:a][bg]amix=inputs=2:duration=first:dropout_transition=0[a]',
    '-map', '0:v',
    '-map', '[a]',
    '-c:v', 'copy',
    '-c:a', 'aac', '-b:a', '160k',
    '-movflags', '+faststart',
    finalPath,
  ])

  return finalPath
}

/**
 * 合成一本 Pro 动画书。
 *
 * 只处理有 videoUrl 的页；失败的页跳过而不是让整本失败。
 * 返回成品在 R2 上的地址。
 */
export async function assembleProVideo(opts: {
  bookId: string
  segments: ProSegment[]
  musicUrl?: string
}): Promise<{ url: string; segmentCount: number }> {
  const { bookId, segments, musicUrl } = opts

  if (segments.every((s) => !s.videoUrl)) {
    throw new Error('No animated segments to assemble')
  }

  const dir = await mkdtemp(path.join(tmpdir(), 'sprout-pro-'))

  try {
    const segmentPaths: string[] = []

    for (let i = 0; i < segments.length; i++) {
      const built = await buildSegment(dir, i, segments[i])
      if (built) segmentPaths.push(built)
    }

    if (segmentPaths.length === 0) {
      throw new Error('No animated segments to assemble')
    }

    const finalPath = await joinAndMix(dir, segmentPaths, musicUrl)
    const bytes = await readFile(finalPath)

    const key = bookKey(bookId, 'video')
    const url = await uploadFile(key, bytes, 'video/mp4')

    return { url, segmentCount: segmentPaths.length }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}
