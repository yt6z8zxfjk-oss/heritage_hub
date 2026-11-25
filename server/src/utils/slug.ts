const pairs: Array<[string, string]> = [
  ["а", "a"], ["б", "b"], ["в", "v"], ["г", "g"], ["д", "d"], ["е", "e"], ["ё", "e"],
  ["ж", "zh"], ["з", "z"], ["и", "i"], ["й", "j"], ["к", "k"], ["л", "l"], ["м", "m"],
  ["н", "n"], ["о", "o"], ["п", "p"], ["р", "r"], ["с", "s"], ["т", "t"], ["у", "u"],
  ["ф", "f"], ["х", "h"], ["ц", "c"], ["ч", "ch"], ["ш", "sh"], ["щ", "sch"], ["ъ", ""],
  ["ы", "y"], ["ь", ""], ["э", "e"], ["ю", "yu"], ["я", "ya"], ["і", "i"], ["ў", "u"],
];

export function makeSlug(value: string) {
  const lower = value.trim().toLowerCase();
  const mapped = lower
    .split("")
    .map((letter) => {
      const pair = pairs.find((item) => item[0] === letter);
      return pair ? pair[1] : letter;
    })
    .join("");
  const slug = mapped.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "object";
}
