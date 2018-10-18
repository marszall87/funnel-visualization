import babel from 'rollup-plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import visualizer from 'rollup-plugin-visualizer';
import postcssNested from 'postcss-nested';
import camelCase from 'camelcase';
import pkg from './package.json';

const dev = process.env.BUILD !== 'production';

const config = minify => ({
    input: 'src/index.js',
    output: [
        {
            file: `dist/${pkg.name}.umd${minify ? '.min' : ''}.js`,
            format: 'umd',
            name: camelCase(pkg.name, { pascalCase: true }),
            sourcemap: minify
        },
        {
            file: `dist/${pkg.name}.esm${minify ? '.min' : ''}.js`,
            format: 'esm',
            sourcemap: minify
        },
        {
            file: `dist/${pkg.name}${minify ? '.min' : ''}.js`,
            format: 'cjs',
            sourcemap: minify
        }
    ],
    external: [...Object.keys(pkg.peerDependencies || {})],
    plugins: [
        postcss({
            modules: {
                generateScopedName: name => {
                    return `${pkg.name}-${name}`;
                }
            },
            extract: `dist/${pkg.name}.css`,
            plugins: [postcssNested]
        }),
        babel({
            exclude: 'node_modules/**'
        }),
        resolve(),
        commonjs(),
        minify && terser(),
        !minify && visualizer()
    ]
});

export default (dev ? [config(false)] : [config(false), config(true)]);
