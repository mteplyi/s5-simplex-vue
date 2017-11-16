let path = require('path');
let webpack = require('webpack');

module.exports = {
	entry: ['babel-polyfill', './src/main.js'],
	output: {
		path: path.resolve(__dirname, './docs'),
		publicPath: '/docs/',
		filename: 'build.js',
	},
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: {
					preLoaders: {
						html: 'html-minify-loader',
					},
					preserveWhitespace: false,
				},
			}, {
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules/,
			}, {
				test: /\.(png|jpg|gif|svg)$/,
				loader: 'file-loader',
				options: {
					name: '[name].[ext]?[hash]',
				},
			}],
	},
	resolve: {
		alias: {
			'vue$': 'vue/dist/vue.esm.js',
		},
	},
	devServer: {
		historyApiFallback: true,
		noInfo: true,
		overlay: true,
	},
	performance: {
		hints: false,
	},
	devtool: '#eval-source-map',
};

if (process.env.NODE_ENV === 'production') {
	module.exports.resolve.alias.vue$ = 'vue/dist/vue.runtime.esm.js';
	module.exports.devtool = '#source-map';
	module.exports.plugins = (module.exports.plugins || []).concat([
		new webpack.DefinePlugin({
			'process.env': {
				NODE_ENV: '"production"',
			},
		}),
		new webpack.optimize.UglifyJsPlugin({
			sourceMap: false,
			ie8: true,
			mangle: {
				safari10: true,
				toplevel: true,
				eval: true,
				properties: {
					builtins: true,
				},
			},
			compress: {
				warnings: false,
				
				unsafe: true,
				
				//drop_console: true,
			},
		}),
		new webpack.optimize.OccurrenceOrderPlugin(true),
		new webpack.LoaderOptionsPlugin({
			minimize: true,
		}),]);
}
