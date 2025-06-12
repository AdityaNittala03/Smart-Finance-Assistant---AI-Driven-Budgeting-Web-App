const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
    const isDevelopment = argv.mode === 'development';
    
    return {
        entry: './src/index.js',
        output: {
            path: path.resolve(__dirname, 'dist'),
            filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
            clean: true,
            publicPath: '/'
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
                    test: /\.css$/,
                    use: [
                        isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                        'css-loader'
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [
                        isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
                        'css-loader',
                        'sass-loader'
                    ]
                },
                {
                    test: /\.(png|jpg|jpeg|gif|svg)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'images/[name].[hash][ext]'
                    }
                },
                {
                    test: /\.(woff|woff2|eot|ttf|otf)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name].[hash][ext]'
                    }
                }
            ]
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: './src/index.html',
                filename: 'index.html',
                inject: 'body'
            }),
            ...(isDevelopment ? [] : [
                new MiniCssExtractPlugin({
                    filename: '[name].[contenthash].css'
                })
            ])
        ],
        devServer: {
            static: {
                directory: path.join(__dirname, 'dist')
            },
            port: 3000,
            hot: true,
            historyApiFallback: true,
            proxy: {
                '/api': {
                    target: 'http://localhost:5000',
                    changeOrigin: true
                }
            }
        },
        resolve: {
            extensions: ['.js', '.json'],
            alias: {
                '@': path.resolve(__dirname, 'src'),
                '@components': path.resolve(__dirname, 'src/components'),
                '@services': path.resolve(__dirname, 'src/services'),
                '@utils': path.resolve(__dirname, 'src/utils'),
                '@styles': path.resolve(__dirname, 'src/styles'),
                '@assets': path.resolve(__dirname, 'src/assets')
            }
        },
        optimization: {
            splitChunks: {
                chunks: 'all',
                cacheGroups: {
                    vendor: {
                        test: /[\\/]node_modules[\\/]/,
                        name: 'vendors',
                        chunks: 'all'
                    }
                }
            }
        }
    };
};