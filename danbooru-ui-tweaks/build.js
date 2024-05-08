const esbuild = require("esbuild");
const fs = require("node:fs");

const cmd = process.argv.slice(2)[0];
const isDev = cmd === "dev";
const isProd = cmd === "build";
const pkg = require("./package.json");

const meta = fs
  .readFileSync("./src/meta.ts")
  .toString()
  .replace(/APP_NAME/g, pkg.name)
  .replace(/DESCRIPTION/g, pkg.description)
  .replace(/VERSION/g, pkg.version)
  .replace(/AUTHOR/g, pkg.author);

async function buildMain() {
  const sharedOptions = {
    entryPoints: ["src/index.ts"],
    bundle: true,
    banner: { js: meta },
  };

  if (isDev) {
    const filename = `${pkg.name}.dev.user.js`;
    const ctx = await esbuild.context({
      ...sharedOptions,
      banner: {
        js: meta.replace(/FILENAME/g, filename),
      },
      outfile: `dist/${filename}`,
    });

    await ctx.watch();
  } else {
    const filename = `${pkg.name}.user.js`;
    await esbuild.build({
      ...sharedOptions,
      banner: {
        js: meta.replace(/FILENAME/g, filename),
      },
      outfile: `dist/${filename}`,
      minify: false,
    });

    const minifiedFilename = `${pkg.name}.min.user.js`;
    await esbuild.build({
      ...sharedOptions,
      banner: {
        js: meta.replace(/FILENAME/g, minifiedFilename),
      },
      outfile: `dist/${minifiedFilename}`,
      minify: true,
    });
  }
}

buildMain();
