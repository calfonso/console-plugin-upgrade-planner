import * as path from 'path';
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const config: any = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: './src/frontend/plugin-entry.tsx',
  output: {
    path: path.resolve(__dirname, 'dist/frontend'),
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@frontend': path.resolve(__dirname, 'src/frontend'),
      '@types': path.resolve(__dirname, 'src/frontend/types'),
      '@services': path.resolve(__dirname, 'src/frontend/services'),
      '@components': path.resolve(__dirname, 'src/frontend/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'src/frontend/tsconfig.json'),
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new ConsoleRemotePlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'manifests'), to: 'manifests' },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist/frontend'),
    },
    port: 9001,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    compress: true,
    hot: true,
  },
  devtool: 'source-map',
};

export default config;
