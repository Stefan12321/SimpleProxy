const path = require("path");
const HTMLPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin")

module.exports = {
    entry: {
        popup: path.resolve("src/popup/index.tsx"),
        settings: path.resolve("src/settings/index.tsx")
    },
    mode: "production",
    module: {
        rules: [
            {
              test: /\.tsx?$/,
               use: [
                 {
                  loader: "ts-loader",
                   options: {
                     compilerOptions: { noEmit: false },
                    }
                  }],
               exclude: /node_modules/,
            },
            {
              test: /\.css$/,
               use: [
                  "style-loader",
                  "css-loader"
               ]
            },
        ],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { from: "manifest.json", to: "../manifest.json" },
                { from: "./src/service-worker.js", to: "../service-worker.js" },
                { from: "img", to: "../img" },
            ],
        }),
        ...getHtmlPlugins([
            "popup",
            "settings"
        ]),
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js"],
    },
    output: {
        path: path.join(__dirname, "./build/selfproxyReact/js"),
        filename: "[name].js",
    },
};

function getHtmlPlugins(chunks) {
    return chunks.map(
        (chunk) =>
            new HTMLPlugin({
                title: "Settings",
                filename: `${chunk}.html`,
                chunks: [chunk],
            })
    );
}
