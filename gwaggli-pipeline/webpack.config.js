const path = require('path');
const nodeExternals = require('webpack-node-externals');

// https://medium.com/@turhan.oz/typescript-with-jasmine-easy-project-setup-530c7cc764e8

module.exports = {
    target: 'node',
    mode: 'production',
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
                include: [path.resolve(__dirname, 'src')],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    externals: [nodeExternals()],
};
