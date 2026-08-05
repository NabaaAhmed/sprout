// Tiny hand-drawn pixel-art icons for the whole app, built from a simple
// character grid (one string per row). Rows are padded/trimmed to a
// consistent width by PixelIcon, so a stray character never breaks layout.
//
// Palette key (see PALETTE in PixelIcon.jsx):
//   . transparent   c charcoal (outline)   s sage   m moss
//   p soft peach    b soft blush           g soft gold
//   w brown         k sky                  r cream  h white highlight

export const ICONS = {
  coin: [
    '..cccc..',
    '.cggggc.',
    'cggggggc',
    'cghhgggc',
    'cggggggc',
    'cggggggc',
    '.cggggc.',
    '..cccc..',
  ],

  flame: [
    '...cc...',
    '..cppc..',
    '.cppppc.',
    '.cpggpc.',
    '.cpggpc.',
    '.cppppc.',
    '..cppc..',
    '...cc...',
  ],

  settings: [
    '........',
    '..cc....',
    'cccccccc',
    '..cc....',
    '........',
    '....cc..',
    'cccccccc',
    '....cc..',
  ],

  home: [
    '...cc...',
    '..cssc..',
    '.cssssc.',
    'cssssssc',
    'cmmwwmmc',
    'cmmwwmmc',
    'cmmwwmmc',
    'cccccccc',
  ],

  shop: [
    '..cc.cc.',
    '..c...c.',
    'cwwwwwwc',
    'cwppppwc',
    'cwppppwc',
    'cwppppwc',
    'cwwwwwwc',
    '........',
  ],

  journal: [
    'cccccccc',
    'crrrrrrc',
    'crmmmrrc',
    'crrrrrrc',
    'crmmmrrc',
    'crrrrrrc',
    'crrrrrrc',
    'cccccccc',
  ],

  heart: [
    '.cc.cc..',
    'cbbcbbc.',
    'cbbbbbbc',
    'cbbbbbbc',
    '.cbbbbc.',
    '..cbbc..',
    '...cc...',
    '........',
  ],

  leaf: [
    '...cc...',
    '..cssc..',
    '.cssmsc.',
    'csssmssc',
    'csssmssc',
    '.cssmsc.',
    '..cssc..',
    '...cc...',
  ],

  trophy: [
    '.cgggc..',
    'cggggggc',
    'cggggggc',
    '.cgggc..',
    '..cggc..',
    '..cggc..',
    '.cgggc..',
    '..cccc..',
  ],

  hourglass: [
    'cccccccc',
    'crrrrrrc',
    '.crrrrc.',
    '..crrc..',
    '..crrc..',
    '.crrrrc.',
    'crggggrc',
    'cccccccc',
  ],

  sparkle: [
    '...c...',
    '...g...',
    '..ggg..',
    'cgggggc',
    '..ggg..',
    '...g...',
    '...c...',
  ],

  teardrop: [
    '..c...',
    '.ckc..',
    'ckkkc.',
    'ckkkkc',
    '.ckkc.',
    '..cc..',
  ],

  book: [
    'cccccccc',
    'crrrrrrc',
    'crmmmrrc',
    'crrrrrrc',
    'crmmmrrc',
    'crrrrrrc',
    'crrrrrrc',
    'cccccccc',
  ],

  berry: [
    '..s...',
    '.cbbc.',
    'cbbbbc',
    'cbbbbc',
    '.cbbc.',
    '..cc..',
  ],

  mushroom: [
    '..cccc..',
    '.cppppc.',
    'cppbbppc',
    'cppppppc',
    '..crrc..',
    '..crrc..',
    '..crrc..',
    '..cccc..',
  ],

  honey: [
    '..wwww..',
    '..wwww..',
    '.cggggc.',
    'cggggggc',
    'cgghhggc',
    'cggggggc',
    '.cggggc.',
    '..cccc..',
  ],

  lantern: [
    '...cc...',
    '..wwww..',
    '.cggggc.',
    'cggggggc',
    'cgghhggc',
    'cggggggc',
    '.cggggc.',
    '..wwww..',
  ],

  plant: [
    '...s....',
    '..sss...',
    '.sssss..',
    'sssssss.',
    '..cwc...',
    '.cwwwc..',
    '.cwwwc..',
    '..ccc...',
  ],

  books: [
    'cccccccc',
    'crrrrrrc',
    'cccccccc',
    'cssssssc',
    'cccccccc',
    'cbbbbbbc',
    'cccccccc',
    '........',
  ],

  rug: [
    '..cccc..',
    '.cwwwwc.',
    'cwppppwc',
    'cwppppwc',
    'cwppppwc',
    'cwppppwc',
    '.cwwwwc.',
    '..cccc..',
  ],

  scarf: [
    'cccccc..',
    'cbbppbc.',
    'cppbbpc.',
    'cbbppbc.',
    '.cccccc.',
    '..c.c.c.',
    '..c.c.c.',
    '........',
  ],

  acorn: [
    '.cwwwwc.',
    'cwwwwwwc',
    '.cppppc.',
    'cppppppc',
    'cppppppc',
    '.cppppc.',
    '..cccc..',
    '........',
  ],

  glasses: [
    '.........',
    'ccc.ccc..',
    'ckkcckkc.',
    'ccc.ccc..',
    '.........',
  ],

  snowflake: [
    '...c...',
    '...k...',
    '...k...',
    'ckkkkkc',
    '...k...',
    '...k...',
    '...c...',
  ],

  fireflyjar: [
    '..wwww..',
    '..wwww..',
    '.ckkkkc.',
    'ckkgkkkc',
    'ckkkkkkc',
    'ckkkkkkc',
    '.ckkkkc.',
    '..cccc..',
  ],

  close: [
    'cc....cc',
    '.cc..cc.',
    '..cccc..',
    '...cc...',
    '...cc...',
    '..cccc..',
    '.cc..cc.',
    'cc....cc',
  ],

  soundOn: [
    '.cc.....',
    'ccsc.c..',
    'ccsc....',
    'ccsc.c..',
    'ccsc....',
    'ccsc.c..',
    '.cc.....',
    '........',
  ],

  soundOff: [
    '.cc.....',
    'ccsc...c',
    'ccsc..c.',
    'ccsc.c..',
    'ccsc..c.',
    'ccsc...c',
    '.cc.....',
    '........',
  ],

  pencil: [
    '.....cc.',
    '....cgc.',
    '...cgc..',
    '..cgc...',
    '.cgc....',
    'cgc.....',
    'cc......',
    '........',
  ],

  // Stickers — tiny wearable decorations (multi-equip)
  sunglasses: [
    '........',
    'cccccccc',
    'ckkcckkc',
    'ckkcckkc',
    'cccccccc',
    '........',
    '........',
    '........',
  ],

  bandana: [
    '........',
    '..cccc..',
    '.cbbbbc.',
    'cbbbbbbc',
    '.cbbbc..',
    '..cbc...',
    '...c....',
    '........',
  ],

  flower: [
    '...c....',
    '..cbc...',
    '.cbpbc..',
    'cbpgpbc.',
    '.cbpbc..',
    '..cbc...',
    '...m....',
    '........',
  ],

  sparkleStickers: [
    'c...c...',
    '.c.c.c..',
    '..c..c..',
    '.c.c....',
    'c...c.c.',
    '.....c..',
    '....c.c.',
    '........',
  ],

  bow: [
    '........',
    'cc...cc.',
    'cbbcbbc.',
    '.cbbbcc.',
    '..ccc...',
    '.cbbbcc.',
    'cbbcbbc.',
    'cc...cc.',
  ],
}
