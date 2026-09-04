const graphemes = new Intl.Segmenter("es", { granularity: "grapheme" });

export function countText(text: string) {
  const characters = Array.from(graphemes.segment(text), (item) => item.segment);
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{M}\p{N}]*(?:['’][\p{L}\p{M}\p{N}]+)*/gu) ?? [];
  return {
    words: words.length,
    characters: characters.length,
    withoutSpaces: characters.filter((character) => !/^\s+$/u.test(character)).length,
  };
}
