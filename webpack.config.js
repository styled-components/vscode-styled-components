//@ts-check

"use strict";

const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = (_, argv) => {
  /**@type {import('webpack').Configuration}*/
  const config = {
    target: "node", // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/

    entry: ["./src/extension.ts"], // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "extension.js",
      libraryTarget: "commonjs2",
      devtoolModuleFilenameTemplate: "../[resource-path]",
    },
    devtool: argv.mode === "development" ? "source-map" : false,
    externals: {
      vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: {
      // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
      extensions: [".ts", ".js"],
    },
    plugins: [new CleanWebpackPlugin()],
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "ts-loader",
            },
          ],
        },
      ],
    },
  };

  return config;
};
