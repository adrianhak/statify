const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
	productionSourceMap: false,
	configureWebpack: {
		devtool: 'source-map',
		resolve: {
			alias: {
				vue$: process.env.VUE_APP_DIST 
			}
		},
		optimization: {

			splitChunks: {
        minSize: 10000,
        maxSize: 250000,
				cacheGroups: {
        	node_vendors: {
          	test: /[\\/]node_modules[\\/]/,
            chunks: "all",
            priority: 1
          }
        }
      },
			minimizer: [
				new TerserPlugin({
					terserOptions: {
						warnings: false,
						compress: { drop_console: true },
						output: { comments: false },
					},
					parallel: true,
					extractComments: false,
					sourceMap: process.env.NODE_ENV == 'development'
				})
			]
		}
	}
}
