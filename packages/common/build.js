const esbuild = require("esbuild");
const fs = require("node:fs");

const cmd = process.argv.slice(2)[0];
const isDev = cmd === "dev";
const cwd = process.cwd();
const pkg = require(`${cwd}/package.json`);

const meta = fs
  .readFileSync(`${cwd}/src/meta.ts`)
  .toString()
  .replace(/DIR_NAME/g, pkg.name)
  .replace(/DESCRIPTION/g, pkg.description)
  .replace(/VERSION/g, pkg.version)
  .replace(/AUTHOR/g, pkg.author);

async function buildMain() {
  const sharedOptions = {
    entryPoints: ["src/index.ts"],
    bundle: true,
  };

  if (isDev) {
    const filename = `${pkg.name}.dev.user.js`;
    const ctx = await esbuild.context({
      ...sharedOptions,
      banner: {
        js: meta
          .replace(/FILENAME/g, filename)
          .replace(/APP_NAME/g, `${pkg.name} (dev)`),
      },
      outfile: `dist/${filename}`,
    });

    await ctx.watch();
  } else {
    const filename = `${pkg.name}.user.js`;
    await esbuild.build({
      ...sharedOptions,
      banner: {
        js: meta
          .replace(/FILENAME/g, filename)
          .replace(/APP_NAME/g, pkg.name),
      },
      outfile: `dist/${filename}`,
      minify: false,
    });

    const minifiedFilename = `${pkg.name}.min.user.js`;
    await esbuild.build({
      ...sharedOptions,
      banner: {
        js: meta
          .replace(/FILENAME/g, minifiedFilename)
          .replace(/APP_NAME/g, `${pkg.name} (minified)`),
      },
      outfile: `dist/${minifiedFilename}`,
      minifySyntax: true,
      minifyIdentifiers: false,
    });
  }
}

buildMain();
