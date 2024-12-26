import { sv } from "./variables.js";

export async function loadShaders() {
  console.log(" loading shaders ");
  const vertexLoader = import.meta.glob("/shader/vert.vert", {
    as: "raw",
  });
  const fragmentLoader = sv.oneActiveImage
    ? import.meta.glob("/shader/single.frag", { as: "raw" })
    : import.meta.glob("/shader/single.frag", { as: "raw" });

  const [vertex, fragment] = await Promise.all([
    vertexLoader["/shader/vert.vert"](),
    sv.oneActiveImage
      ? fragmentLoader["/shader/single.frag"]()
      : fragmentLoader["/shader/single.frag"](),
  ]);

  return { vertex, fragment };
}
