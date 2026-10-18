// 绘本风格层数据（依据《AI 制作绘本的超详细攻略》第二章「绘本风格」）
// STYLE_LIBRARY：15 种主风格；AGE_COLOR_GUIDE：各年龄段护眼配色指南。

/** 风格库条目 */
export interface StyleLibraryEntry {
  /** 风格 id（英文短标识） */
  id: string
  /** 中文风格名 */
  name: string
  /** 英文风格名 */
  nameEn: string
  /** 适配年龄段（0-3 / 3-6 / 6-9） */
  suitableAges: string[]
  /** 适配主题 */
  suitableThemes: string
  /** 风格特征 */
  features: string
  /** AI 生图关键词（英文，FLUX 友好） */
  aiKeywords: string
}

/** 15 种绘本主风格（一本只选 1 个） */
export const STYLE_LIBRARY: StyleLibraryEntry[] = [
  {
    id: 'gentle-watercolor',
    name: '温柔水彩绘本风',
    nameEn: 'Gentle Watercolor Picture-Book Style',
    suitableAges: ['0-3', '3-6', '6-9'],
    suitableThemes: '温暖治愈的日常故事、亲情友情、自然与四季',
    features: '水彩晕染、柔和边缘、透明叠色、手绘笔触',
    aiKeywords:
      'gentle watercolor children book illustration, soft wet-on-wet washes, delicate ink outlines, pastel translucent colors, dreamy soft edges, storybook quality',
  },
  {
    id: 'soft-cartoon',
    name: '软萌卡通绘本风',
    nameEn: 'Soft Cute Cartoon Picture-Book Style',
    suitableAges: ['0-3', '3-6'],
    suitableThemes: '低龄启蒙、可爱动物、习惯养成',
    features: '圆润造型、大头小身、粗描边、明亮纯色块',
    aiKeywords:
      'soft cute cartoon children book illustration, rounded chubby shapes, big heads small bodies, bold clean outlines, bright cheerful flat colors, friendly characters',
  },
  {
    id: 'crayon',
    name: '蜡笔手绘风',
    nameEn: 'Crayon Hand-Drawn Style',
    suitableAges: ['0-3', '3-6'],
    suitableThemes: '童趣涂鸦、想象游戏、幼儿认知',
    features: '蜡笔颗粒质感、粗犷线条、手工涂色痕迹',
    aiKeywords:
      'crayon hand drawn children illustration, waxy textured strokes, rough sketchy outlines, childlike playful scribbles, warm paper grain',
  },
  {
    id: 'colored-pencil',
    name: '彩铅细腻风',
    nameEn: 'Delicate Colored-Pencil Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: '细腻科普、自然观察、温情叙事',
    features: '细腻排线、柔和渐变、纸纹质感',
    aiKeywords:
      'detailed colored pencil children book illustration, fine pencil hatching, soft blended gradients, visible paper texture, warm natural tones',
  },
  {
    id: 'flat-modern',
    name: '现代扁平插画风',
    nameEn: 'Modern Flat Illustration Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: '城市生活、科普认知、现代家庭',
    features: '无描边色块、几何简化、干净留白',
    aiKeywords:
      'modern flat vector illustration, bold geometric shapes, no outlines, clean simple silhouettes, limited color palette, generous negative space',
  },
  {
    id: 'dreamy-fairytale',
    name: '梦幻童话风',
    nameEn: 'Dreamy Fairy-Tale Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: '魔法冒险、公主精灵、幻想世界',
    features: '发光粒子、星空梦幻、柔和光晕',
    aiKeywords:
      'dreamy fairy tale children illustration, glowing sparkles, magical soft light, starry ethereal atmosphere, luminous pastel glow, enchanted whimsical world',
  },
  {
    id: 'fresh-nature',
    name: '自然清新风',
    nameEn: 'Fresh Natural Style',
    suitableAges: ['0-3', '3-6', '6-9'],
    suitableThemes: '自然探索、植物动物、四季变化',
    features: '清新绿色调、光线通透、自然植物元素',
    aiKeywords:
      'fresh natural children illustration, soft green and sky blue palette, airy sunlight, delicate botanical details, clean bright and calm',
  },
  {
    id: 'light-3d',
    name: '轻3D卡通风',
    nameEn: 'Light 3D Cartoon Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: '冒险故事、拟人角色、科技幻想',
    features: '柔和立体造型、细腻光影、圆润材质',
    aiKeywords:
      'light 3D cartoon render, soft rounded 3D characters, gentle studio lighting, matte smooth materials, cozy cinematic 3D look, clean simple background',
  },
  {
    id: 'paper-cut',
    name: '剪纸拼贴风',
    nameEn: 'Paper-Cut Collage Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: '民俗故事、节日文化、几何创意',
    features: '平面剪纸层叠、纸边质感、投影层次',
    aiKeywords:
      'paper cut collage children illustration, layered flat paper shapes, crisp cut edges, subtle drop shadows, textured craft paper, folk art style',
  },
  {
    id: 'clay',
    name: '黏土手作风',
    nameEn: 'Clay Handcraft Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: '手工创意、拟人角色、温馨日常',
    features: '黏土捏塑质感、柔光、手工痕迹',
    aiKeywords:
      'clay handcraft children illustration, plasticine modeling clay characters, soft warm lighting, hand-sculpted texture, matte dough surface, stop-motion craft feel',
  },
  {
    id: 'retro-vintage',
    name: '复古童书风',
    nameEn: 'Retro Vintage Children\'s-Book Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: '经典童话、怀旧故事、传统寓言',
    features: '复古配色、印刷网点、旧纸本质感',
    aiKeywords:
      'vintage retro children book illustration, muted retro palette, mid-century storybook style, subtle print grain, aged paper texture, classic nursery art',
  },
  {
    id: 'chinese-style',
    name: '国风儿童插画风',
    nameEn: 'Chinese-Style Children\'s Illustration',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: '中国传统节日、神话传说、诗词意境',
    features: '水墨笔触、工笔重彩、古典纹样',
    aiKeywords:
      'Chinese style children illustration, ink wash brush strokes, fine-line elegance, traditional patterns, elegant oriental palette, poetic oriental scenery',
  },
  {
    id: 'comic-panel',
    name: '漫画分镜风',
    nameEn: 'Comic Panel Style',
    suitableAges: ['6-9'],
    suitableThemes: '冒险故事、幽默情节、科普叙事',
    features: '分镜构图、动态线条、清晰描边',
    aiKeywords:
      'comic panel children illustration, dynamic layout, bold expressive outlines, action motion lines, vivid cel shading, clean panel composition',
  },
  {
    id: 'minimal-toddler',
    name: '极简低龄认知风',
    nameEn: 'Minimalist Toddler Cognition Style',
    suitableAges: ['0-3'],
    suitableThemes: '认知启蒙、颜色形状、生活物品',
    features: '单一主体、超大留白、高对比简单色块',
    aiKeywords:
      'minimalist toddler cognition illustration, single centered subject, very clean white background, bold simple shapes, high contrast basic colors, uncluttered',
  },
  {
    id: 'oil-painting',
    name: '油画质感绘本风',
    nameEn: 'Oil-Painting Textured Picture-Book Style',
    suitableAges: ['6-9'],
    suitableThemes: '艺术启蒙、经典改写、情感深度故事',
    features: '厚涂笔触、丰富色彩层次、画布纹理',
    aiKeywords:
      'oil painting textured children book illustration, thick impasto brush strokes, rich layered colors, canvas texture, soft warm chiaroscuro light',
  },
]

/** 各年龄段护眼配色指南（文档 2.2） */
export const AGE_COLOR_GUIDE: Record<string, string> = {
  '0-3':
    '明亮柔和基础色、背景干净、避免颜色过多/暗背景 (bright soft basic colors, clean plain background, avoid too many colors and dark backgrounds)',
  '3-6':
    '低饱和暖色（粉蓝/粉绿/奶油黄）、避免高饱和荧光色/大面积强红强紫 (low-saturation warm tones: soft pink-blue / pink-green / creamy yellow; avoid high-saturation fluorescent colors and large areas of intense red or purple)',
  '6-9':
    '自然色/梦幻色/主题色组合、避免过度幼稚/灰暗 (combination of natural colors / dreamy colors / theme colors; avoid over-childish or gloomy dark tones)',
}
