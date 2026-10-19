// 绘本风格层数据（依据《AI 制作绘本的超详细攻略》第二章「绘本风格」）
// STYLE_LIBRARY：15 种主风格；AGE_COLOR_GUIDE：各年龄段护眼配色指南。

/** 风格库条目 */
export interface StyleLibraryEntry {
  /** 风格 id（英文短标识） */
  id: string
  /** 英文风格名 */
  name: string
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
    name: 'Gentle Watercolor Picture-Book Style',
    suitableAges: ['0-3', '3-6', '6-9'],
    suitableThemes: 'Warm, healing everyday stories, family and friendship, nature and the seasons',
    features: 'Soft watercolor washes, gentle edges, translucent layered colors, hand-painted brushwork',
    aiKeywords:
      'gentle watercolor children book illustration, soft wet-on-wet washes, delicate ink outlines, pastel translucent colors, dreamy soft edges, storybook quality',
  },
  {
    id: 'soft-cartoon',
    name: 'Soft Cute Cartoon Picture-Book Style',
    suitableAges: ['0-3', '3-6'],
    suitableThemes: 'Early learning for toddlers, cute animals, habit building',
    features: 'Rounded shapes, big heads and small bodies, bold outlines, bright solid color blocks',
    aiKeywords:
      'soft cute cartoon children book illustration, rounded chubby shapes, big heads small bodies, bold clean outlines, bright cheerful flat colors, friendly characters',
  },
  {
    id: 'crayon',
    name: 'Crayon Hand-Drawn Style',
    suitableAges: ['0-3', '3-6'],
    suitableThemes: 'Playful doodles, imaginative games, toddler cognition',
    features: 'Waxy crayon grain, rough lines, hand-colored marks',
    aiKeywords:
      'crayon hand drawn children illustration, waxy textured strokes, rough sketchy outlines, childlike playful scribbles, warm paper grain',
  },
  {
    id: 'colored-pencil',
    name: 'Delicate Colored-Pencil Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: 'Detailed non-fiction, nature observation, tender narratives',
    features: 'Fine pencil hatching, soft blended gradients, visible paper texture',
    aiKeywords:
      'detailed colored pencil children book illustration, fine pencil hatching, soft blended gradients, visible paper texture, warm natural tones',
  },
  {
    id: 'flat-modern',
    name: 'Modern Flat Illustration Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: 'City life, science and learning, modern families',
    features: 'Outline-free color blocks, geometric simplification, clean negative space',
    aiKeywords:
      'modern flat vector illustration, bold geometric shapes, no outlines, clean simple silhouettes, limited color palette, generous negative space',
  },
  {
    id: 'dreamy-fairytale',
    name: 'Dreamy Fairy-Tale Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: 'Magical adventures, princesses and fairies, fantasy worlds',
    features: 'Glowing sparkles, starry dreaminess, soft halos',
    aiKeywords:
      'dreamy fairy tale children illustration, glowing sparkles, magical soft light, starry ethereal atmosphere, luminous pastel glow, enchanted whimsical world',
  },
  {
    id: 'fresh-nature',
    name: 'Fresh Natural Style',
    suitableAges: ['0-3', '3-6', '6-9'],
    suitableThemes: 'Nature exploration, plants and animals, the four seasons',
    features: 'Fresh green tones, airy light, natural botanical elements',
    aiKeywords:
      'fresh natural children illustration, soft green and sky blue palette, airy sunlight, delicate botanical details, clean bright and calm',
  },
  {
    id: 'light-3d',
    name: 'Light 3D Cartoon Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: 'Adventure stories, anthropomorphic characters, sci-fi fantasy',
    features: 'Soft three-dimensional forms, delicate lighting, rounded materials',
    aiKeywords:
      'light 3D cartoon render, soft rounded 3D characters, gentle studio lighting, matte smooth materials, cozy cinematic 3D look, clean simple background',
  },
  {
    id: 'paper-cut',
    name: 'Paper-Cut Collage Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: 'Folk tales, festival culture, geometric creativity',
    features: 'Layered flat paper cutouts, paper-edge texture, shadowed depth',
    aiKeywords:
      'paper cut collage children illustration, layered flat paper shapes, crisp cut edges, subtle drop shadows, textured craft paper, folk art style',
  },
  {
    id: 'clay',
    name: 'Clay Handcraft Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: 'Craft and creativity, anthropomorphic characters, cozy everyday life',
    features: 'Sculpted clay texture, soft warm light, handmade marks',
    aiKeywords:
      'clay handcraft children illustration, plasticine modeling clay characters, soft warm lighting, hand-sculpted texture, matte dough surface, stop-motion craft feel',
  },
  {
    id: 'retro-vintage',
    name: 'Retro Vintage Children\'s-Book Style',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: 'Classic fairy tales, nostalgic stories, traditional fables',
    features: 'Retro palette, print halftone dots, aged-paper texture',
    aiKeywords:
      'vintage retro children book illustration, muted retro palette, mid-century storybook style, subtle print grain, aged paper texture, classic nursery art',
  },
  {
    id: 'chinese-style',
    name: 'Chinese-Style Children\'s Illustration',
    suitableAges: ['3-6', '6-9'],
    suitableThemes: 'Chinese traditional festivals, myths and legends, poetic imagery',
    features: 'Ink-wash brushwork, fine-line heavy color, classical patterns',
    aiKeywords:
      'Chinese style children illustration, ink wash brush strokes, fine-line elegance, traditional patterns, elegant oriental palette, poetic oriental scenery',
  },
  {
    id: 'comic-panel',
    name: 'Comic Panel Style',
    suitableAges: ['6-9'],
    suitableThemes: 'Adventure stories, humorous plots, science storytelling',
    features: 'Panel composition, dynamic lines, crisp outlines',
    aiKeywords:
      'comic panel children illustration, dynamic layout, bold expressive outlines, action motion lines, vivid cel shading, clean panel composition',
  },
  {
    id: 'minimal-toddler',
    name: 'Minimalist Toddler Cognition Style',
    suitableAges: ['0-3'],
    suitableThemes: 'Cognitive learning, colors and shapes, everyday objects',
    features: 'Single subject, extra-large negative space, high-contrast simple color blocks',
    aiKeywords:
      'minimalist toddler cognition illustration, single centered subject, very clean white background, bold simple shapes, high contrast basic colors, uncluttered',
  },
  {
    id: 'oil-painting',
    name: 'Oil-Painting Textured Picture-Book Style',
    suitableAges: ['6-9'],
    suitableThemes: 'Art appreciation, classic retellings, emotionally deep stories',
    features: 'Thick impasto brushwork, rich layered color, canvas texture',
    aiKeywords:
      'oil painting textured children book illustration, thick impasto brush strokes, rich layered colors, canvas texture, soft warm chiaroscuro light',
  },
]

/** 各年龄段护眼配色指南（文档 2.2） */
export const AGE_COLOR_GUIDE: Record<string, string> = {
  '0-3':
    'Bright, soft basic colors; clean plain background. Avoid too many colors and dark backgrounds.',
  '3-6':
    'Low-saturation warm tones (soft pink-blue / pink-green / creamy yellow). Avoid high-saturation fluorescent colors and large areas of intense red or purple.',
  '6-9':
    'A combination of natural colors / dreamy colors / theme colors. Avoid over-childish or gloomy dark tones.',
}
