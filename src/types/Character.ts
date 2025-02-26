export type Character = {
  name: string; // required, max length 128 characters
  species?: string; // optional, max length 64 characters
  colors?: { label: string; hex: string; }[]; // optional, max array length 16, label max length 64, hex length 6
  pronouns?: string; // optional, max length 32 characters
  refSheet?: string; // optional, ref to a app.bsky.feed.post
  altRef?: string; // optional, ref to a app.bsky.feed.post
  drawWithoutAskingSFW?: boolean; // optional
  drawWithoutAskingNSFW?: boolean; // optional
  nsfw?: boolean; // optional
  description?: string; // optional, max length 2560 characters
}

export const CharacterTypeKeys = [
  "name",
  "species",
  "colors",
  "pronouns",
  "refSheet",
  "altRef",
  "drawWithoutAskingSFW",
  "drawWithoutAskingNSFW",
  "nsfw",
  "description"
];

// Validation function
export function validateCharacter(character: Character): { status: boolean, message: string } {
  if (character.name.length > 128) return { status: false, message: "Name exceeds 128 characters" };
  if (character.species && character.species.length > 64) return { status: false, message: "Species exceeds 64 characters" };
  if (character.colors && character.colors.length > 16) return { status: false, message: "Colors array exceeds 16 items" };
  if (character.colors) {
    for (const color of character.colors) {
      if (color.label.length > 64) return { status: false, message: "Color label exceeds 64 characters" };
      if (color.hex.length !== 6) return { status: false, message: "Color hex is not 6 characters" };
    }
  }
  if (character.pronouns && character.pronouns.length > 32) return { status: false, message: "Pronouns exceed 32 characters" };
  if (character.description && character.description.length > 2560) return { status: false, message: "Description exceeds 2560 characters" };
  return { status: true, message: "OK" };
}