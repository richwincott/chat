const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackMd5Hash = require('webpack-md5-hash');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    entry: {
        app: './src/app.ts',
        vendor: ['angular', 'angular-sanitize', 'angular-animate', '@uirouter/angularjs', 'angular-ui-bootstrap', 'angular-base64-upload'],
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
                include: [
                    path.join(__dirname, 'src')
                ],
                use: ExtractTextPlugin.extract({
                    use: [{
                            loader: "css-loader", options: {
                                sourceMap: true
                            }
                        }, {
                            loader: "sass-loader", options: {
                                sourceMap: true
                            }
                        }
                    ],
                    fallback: "style-loader"
                }),
                exclude: [/node_modules/, /build/]
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
        new ExtractTextPlugin({
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
        port: 3000
    },
};  