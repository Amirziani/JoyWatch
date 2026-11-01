const A = ["cozy", "sunny", "fuzzy", "mellow", "velvet", "golden", "snug", "sweet", "dreamy", "gentle", "honey", "peachy"];
const N = ["panda", "blanket", "sofa", "cocoa", "popcorn", "kitten", "pillow", "mango", "lantern", "cookie", "otter", "cloud"];

const pick = <T,>(arr: T[]) => arr[crypto.getRandomValues(new Uint32Array(1))[0] % arr.length];

/** Memorable, easy to read out over the phone: "cozy-panda-42" */
export function suggestPassword() {
  const n = String(crypto.getRandomValues(new Uint32Array(1))[0] % 90 + 10);
  return `${pick(A)}-${pick(N)}-${n}`;
}

export function parseRoomRef(input: string): string | null {
  const m = input.trim().match(/(?:\/r\/)?([a-z0-9]{8,16})\/?(?:[?#].*)?$/i);
  return m ? m[1].toLowerCase() : null;
}
