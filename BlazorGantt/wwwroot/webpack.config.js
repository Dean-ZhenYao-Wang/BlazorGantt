const path = require("path");

module.exports = {
    entry: './index.js', // 入口文件路径，根据实际情况进行更改
    output: {
        filename: 'BlazorGantt.js', // 输出文件名，根据实际情况进行更改
        path: __dirname // 输出目录路径，根据实际情况进行更改
    },
    optimization: {
        minimize: true //是否启用混淆压缩
    },
    resolve: {
        extensions: [".ts", ".js"],
        fallback: {
            https: require.resolve('https-browserify'),
            http: require.resolve('stream-http'),
            url: require.resolve('url/'),
            buffer: require.resolve("buffer/")
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            },
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ]
    }
};