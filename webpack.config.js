const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: {
        app: './src/app.ts',
        vendor: ['angular', 'angular-sanitize', 'angular-animate', '@uirouter/angularjs', 'angular-ui-bootstrap', 'angular-base64-upload', 'angular-moment'],
        styles: './src/styles/index.scss'
    },
    output: {
        filename: '[name].[chunkhash].js',
        chunkFilename: '[name].[chunkhash].js',
        path: path.resolve(__dirname, 'build/js')
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                include: [
                    path.join(__dirname, 'src')
                ],
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: false,
                            onlyCompileBundledFiles: true
                        }
                    }
                ],
                exclude: [/node_modules/]
            },
            {
                test: /\.scss$/,
                /* include: [
                    path.join(__dirname, 'src')
                ], */
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: {
                            hmr: process.env.NODE_ENV === 'development',
                        },
                    },
                    'css-loader',
                    'resolve-url-loader',
                    'sass-loader'
                ],
                exclude: [/build/]
            },
            {
                test: /\.(png|jpg|gif|ttf|otf|woff|woff2|eot|svg)$/,
                use: {
                    loader: "file-loader",
                    options: {
                        name: '[name].[ext]',
                        outputPath: './../assets/'
                    }
                }
            },
            {
                test: /\.html$/,
                include: [
                    path.join(__dirname, 'src')
                ],
                use: [
                    { loader:'ngtemplate-loader?relativeTo=' + __dirname + '/'},
                    { loader: 'html-loader' }
                ],
                exclude: path.resolve(__dirname, './src/index.html')
            }
        ]
    },
    resolve: {
        extensions: [ '.ts', '.js', '.scss', '.css' ]
    },
    node: {
        fs: "empty"
    },
    externals: {
        uws: "uws"
    },
    plugins: [
        new CleanWebpackPlugin('build', {}),
        new MiniCssExtractPlugin({
            filename: './../css/[name].[chunkhash].css'
        }),
        new HtmlWebpackPlugin({
            inject: false,
            template: './src/index.html',
            filename: '../index.html'
        }),
        new WebpackMd5Hash(),
        new WriteFilePlugin(),
        new webpack.ProvidePlugin({
            jQuery: 'jquery'
        }),
    ],
    devServer: {
        contentBase: path.resolve(__dirname, 'build'),
        port: process.env.PORT || 3000
    },
};  