import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Ø UnderTango — pareja de tango en escena, con vestuario rojo e iluminación teatral";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

export default async function ShowsOpenGraphImage() {
  // Keep the original performers and lighting; only frame the photo for sharing.
  const photo = await readFile(
    join(process.cwd(), "public/assets/images/grupal1.png"),
    "base64",
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          background: "#060908",
        }}
      >
        {/* ImageResponse renders the original bytes directly, without a remote fetch. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`data:image/png;base64,${photo}`}
          alt=""
          width={1200}
          height={(1200 * 687) / 978}
          style={{ position: "absolute", top: 0, left: 0 }}
        />
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            bottom: 44,
            width: "100%",
            justifyContent: "center",
            color: "#fff8e7",
            fontSize: 41,
            fontWeight: 400,
            letterSpacing: 5.5,
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            textShadow: "0 3px 20px #000",
          }}
        >
          Ø UNDERTANGO
        </div>
      </div>
    ),
    size,
  );
}
