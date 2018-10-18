import html from 'hyperhtml/esm';
import style from './style.css';

const bucket = (props, opts) => {
    const { id, color } = props;
    const { bucketWidth, borderRadius } = opts;
    return html(props, 'svg')`
        <g class=${style.bucket} transform=${`translate(${props.x} ${props.y})`}>
            <rect x=0 y=${-borderRadius} width=${bucketWidth} height=${props.height +
        2 * borderRadius} fill=${color} rx=${borderRadius} ry=${borderRadius}/>
            <g transform=${`translate(${bucketWidth / 2} ${props.height / 2})`}>
                <text alignment-baseline="baseline" text-anchor="middle" x=0 y=-3 stroke=${color}>${props.title}</text>
                <text class=${style.value} alignment-baseline="hanging" text-anchor="middle" stroke=${color} x=0 y=3>${
        props.value
    }</text>
            </g>
        </g> 
    `;
};

const flow = (props, opts) => {
    const { from, to, height, fromOffset, toOffset, id, percent } = props;
    const { bucketWidth, height: graphHeight } = opts;

    const x1 = from.x + bucketWidth;
    const x2 = to.x;
    const y1 = from.y + (fromOffset || 0) + height / 2;
    const y2 = to.y + (toOffset || 0) + height / 2;

    const width = Math.abs(x1 - x2);
    const radius = 5 * (Math.abs(y1 - y2) / graphHeight) + 2;
    const straight = y1 === y2;
    const extension = width > 2 * bucketWidth;
    const curveX = extension ? width - bucketWidth : 0;

    const gradientUrl = `url(#funnel-gradient-${id})`;

    const fontSize = percent < 0.3 ? Math.max(percent * 50 + 7, 12) : 22;
    const labelRadius = 5;

    if (straight) {
        // draw a rectangle, because gradients don't work on straight lines o_O
        return html(props, 'svg')`
            <g class=${style.flow} transform="${`translate(${x1} ${y1 - height / 2})`}">
                <rect x=0 y=0 width=${width} height=${height} fill=${gradientUrl}/>
                <rect x=0 y=0 width=${width} height=${height} fill="url(#flow-pattern)"/>
                <rect x="${width / 2 - fontSize - labelRadius}" y="${height / 2 -
            fontSize / 2 -
            labelRadius}" width="${fontSize * 2 + labelRadius * 2}" height="${fontSize +
            labelRadius * 2}" rx="${labelRadius}" ry="${labelRadius}" fill="${gradientUrl}" />
                <text x=${width / 2} y=${height / 2 +
            1} alignment-baseline="middle" text-anchor="middle" font-size="${`${fontSize}px`}">
                    ${Math.floor(percent * 100)}%
                </text>
            </g>
        `;
    } else {
        const path = [
            `M ${0} ${y1}`,
            extension ? `L ${curveX} ${y1}` : '',
            `C ${curveX + width / radius} ${y1}, ${width - width / radius} ${y2}, ${width} ${y2}`
        ].join(' ');

        const textY = extension ? y1 : Math.min(y1, y2) + Math.abs(y1 - y2) / 2;

        return html(props, 'svg')`
            <g class=${style.flow} transform="${`translate(${x1} 0)`}">
                <path d="${path}" fill="none" stroke="${gradientUrl}" stroke-width=${height}/>
                <path d="${path}" fill="none" stroke="url(#flow-pattern)" stroke-width=${height}/>
                <rect x="${width / 2 - fontSize - labelRadius}" y="${textY -
            fontSize / 2 -
            labelRadius}" width="${fontSize * 2 + labelRadius * 2}" height="${fontSize +
            labelRadius * 2}" rx="${labelRadius}" ry="${labelRadius}" fill="${gradientUrl}" />
                <text x=${width / 2} y=${textY +
            1} alignment-baseline="middle" text-anchor="middle" font-size="${`${fontSize}px`}">
                    ${Math.floor(percent * 100)}%
                </text>
            </g>
        `;
    }
};

const drop = (props, opts) => {
    const { from, height, title, percent } = props;
    const { bucketWidth } = opts;

    const radius = 15;
    const padding = 10;

    const x = from.x + bucketWidth;
    const y = from.y + from.height - height + radius;

    const path = [`M 0 0`, `Q ${radius} 0, ${radius} ${radius}`].join(' ');

    return html(props, 'svg')`
        <g transform=${`translate(${x} ${y})`} class=${style.drop}>
            <path fill="none" d="${path}" stroke-width=${radius * 2}/>
            <rect class=${style.solid} x=0 y=${radius} width=${radius * 2} height=${height - radius} />
            <rect x=0 y=${height} width=${radius * 2} height=${padding} fill="url(#funnel-gradient-drop)" />
            <rect x=0 y=${-radius} width=${radius * 2} height="${height +
        padding +
        radius}" fill="url(#drop-pattern)" />
            <text x=3 y=${radius} transform="">${Math.floor(percent * 100)}%</text>
        </g>
    `;
};

const step = (props, opts) => {
    const { x, title } = props;
    const { height, bucketWidth, headerHeight, borderRadius } = opts;
    return html(props, 'svg')`
        <g transform=${`translate(${x} 0)`} class=${style.step}>
            <line x1=${0} y1=${0} x2=${0} y2=${height}/>
            <text text-anchor="middle" x=${bucketWidth / 2} y=${-borderRadius - 10}>${title}</text>
            <line x1=${bucketWidth} y1=${0} x2=${bucketWidth} y2=${height}/>
        </g>
    `;
};

const layoutBuckets = (funnel, opts) => {
    const { bucketWidth, bucketMargin, height, yScale } = opts;

    return funnel.reduce((acc, step, stepIdx) => {
        const bucketCount = step.buckets.length;
        const stepBuckets = step.buckets.reduce((acc, bucket, bucketIdx) => {
            const x = 2 * stepIdx * bucketWidth;
            const y = acc.reduce((sum, b) => sum + b.height + bucketMargin, 0);
            return [
                ...acc,
                {
                    x,
                    y,
                    color: bucket.color,
                    height: bucket.value * yScale,
                    id: bucket.id,
                    value: bucket.value,
                    title: bucket.title
                }
            ];
        }, []);
        return [...acc, ...stepBuckets];
    }, []);
};

const layoutFlows = (funnel, buckets, opts) => {
    const { yScale } = opts;
    return funnel.reduce((acc, step, stepIdx) => {
        return [
            ...acc,
            ...step.buckets.reduce((acc, bucket) => {
                if (!bucket.flows) return acc;
                const to = buckets.find(b => b.id === bucket.id);
                return [
                    ...acc,
                    ...bucket.flows.reduce((acc, flow) => {
                        const from = buckets.find(b => b.id === flow.source);
                        const height = flow.value * yScale;
                        const fromOffset = from.fromOffset || 0;
                        const toOffset = to.toOffset || 0;
                        from.fromOffset = fromOffset + height;
                        to.toOffset = toOffset + height;
                        return [
                            ...acc,
                            {
                                id: `${from.id}-${to.id}`,
                                from,
                                to,
                                value: flow.value,
                                percent: flow.value / from.value,
                                height,
                                fromOffset,
                                toOffset
                            }
                        ];
                    }, [])
                ];
            }, [])
        ];
    }, []);
};

const layoutDrops = (funnel, buckets, opts) => {
    const { yScale } = opts;

    return funnel.reduce((acc, step) => {
        const stepDrops = step.buckets.reduce((acc, bucket) => {
            if (!bucket.drop) return acc;
            const from = buckets.find(b => b.id === bucket.id);
            return [
                ...acc,
                {
                    from,
                    height: bucket.drop.value * yScale,
                    title: bucket.drop.title,
                    percent: bucket.drop.value / bucket.value
                }
            ];
        }, []);
        return [...acc, ...stepDrops];
    }, []);
};

const layoutSteps = (funnel, opts) => {
    const { bucketWidth } = opts;
    return funnel.reduce((acc, step, stepIdx) => {
        const x = 2 * stepIdx * bucketWidth;
        return [
            ...acc,
            {
                x,
                title: step.title
            }
        ];
    }, []);
};

const measureContainer = container => {
    const wrapper = html`<div class=${style.wrapper}></div>`;
    html(container)`${wrapper}`;
    return wrapper.getBoundingClientRect();
};

const flowGradient = (flow, opts) => {
    const { bucketWidth } = opts;
    const id = `funnel-gradient-${flow.id}`;
    const { from, to } = flow;
    return html(flow, 'svg')`
        <linearGradient id=${id} gradientUnits="userSpaceOnUse" x1="0" x2=${bucketWidth} y1="0" y2="0">
            <stop class="funnel-gradient-start" stop-color=${from.color} offset="0%"/>
            <stop class="funnel-gradient-stop" stop-color=${to.color} offset="100%"/>
        </linearGradient>
    `;
};

export default ({ container, funnel = f }) => {
    const stepCount = funnel.length;
    const { width: containerWidth, height: containerHeight } = measureContainer(container);
    const bucketWidth = containerWidth / (2 * stepCount - 1);
    const borderRadius = 10;
    const bucketMargin = 40;
    const headerHeight = 30 + borderRadius;
    const width = containerWidth;
    const height = containerHeight - headerHeight;

    const maxStepValueSum = funnel.reduce((max, step) => {
        const stepValueSum = step.buckets.reduce((sum, b) => sum + b.value + ((b.drop && b.drop.value) || 0), 0);
        return stepValueSum > max ? stepValueSum : max;
    }, 0);

    const yScale = (height - headerHeight) / maxStepValueSum;

    const opts = {
        bucketWidth,
        borderRadius,
        width,
        headerHeight,
        height,
        yScale,
        bucketMargin
    };

    console.log(opts);

    const steps = layoutSteps(funnel, opts);
    const buckets = layoutBuckets(funnel, opts);
    const flows = layoutFlows(funnel, buckets, opts);
    const drops = layoutDrops(funnel, buckets, opts);

    html(container)`
        <div class=${style.wrapper}>
            <svg class=${style.svg}>
            <defs>
                ${flows.map(f => flowGradient(f, opts))}
                <linearGradient id="funnel-gradient-drop" class="funnel-gradient-drop" x1="0" y1="0" x2="0" y2="1">
                    <stop class="funnel-gradient-start" offset="0%"/>
                    <stop class="funnel-gradient-stop" offset="100%"/>
                </linearGradient>
                <g id="arrows">
                    <g>
                        <path d="M 0 -4 L 4 0 L 0 4" fill="none" stroke="white" stroke-width="1" opacity=".3" />
                    </g>
                    <g transform="translate(10, 10)">
                        <path d="M 0 -4 L 4 0 L 0 4" fill="none" stroke="white" stroke-width="1" opacity=".3" />
                    </g>
                    <g transform="translate(0, 20)">
                        <path d="M 0 -4 L 4 0 L 0 4" fill="none" stroke="white" stroke-width="1" opacity=".3" />
                    </g>
                </g>
                <pattern id="flow-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"> 
                    <animateTransform attributeType="xml"
                            attributeName="patternTransform"
                            type="translate" from="0 0" to="20 0" begin="0"
                            dur="1s" repeatCount="indefinite"/>
                    <use xlink:href="#arrows" />
                </pattern>
                <pattern id="drop-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse" > 
                    <animateTransform attributeType="xml"
                            attributeName="patternTransform"
                            type="translate" from="0 0" to="0 20" begin="0"
                            dur="1s" repeatCount="indefinite"/>
                    <use xlink:href="#arrows" transform="rotate(90, 10, 10)" />
                </pattern>
            </defs>
                <g transform="${`translate(0, ${headerHeight})`}">
                    ${buckets.map(b => bucket(b, opts))}
                </g>
                <g transform="${`translate(0, ${headerHeight})`}">
                    ${steps.map(s => step(s, opts))}
                </g>
                <g transform="${`translate(0, ${headerHeight})`}">
                    ${drops.map(d => drop(d, opts))}
                </g>
                <g transform="${`translate(0, ${headerHeight})`}">
                    ${flows.map(f =>
                        flow(
                            f,
                            opts
                        )
                    )}
                </g> 
                
            </svg>
        </div>
    `;
};

const f = [
    {
        title: 'Acquisition',
        buckets: [
            {
                id: 'evaluator',
                title: 'Evaluator',
                value: 100,
                color: '#6554c0',
                drop: {
                    title: 'Never installed',
                    value: 20
                }
            }
        ]
    },
    {
        title: 'Activation',
        buckets: [
            {
                id: 'installed',
                title: 'Installed',
                value: 70,
                color: '#00b8d9',
                flows: [
                    {
                        source: 'evaluator',
                        value: 70
                    }
                ],
                drop: {
                    title: 'Never used',
                    value: 10
                }
            },
            {
                id: 'silent',
                title: 'Silent',
                value: 10,
                color: '#C1C7D0',
                flows: [
                    {
                        source: 'evaluator',
                        value: 10
                    }
                ]
            }
        ]
    },
    {
        title: 'Retention',
        buckets: [
            {
                id: 'active',
                title: 'Active',
                value: 20,
                color: '#0052cc',
                flows: [
                    {
                        source: 'installed',
                        value: 20
                    }
                ],
                drop: {
                    title: 'Eval ended',
                    value: 10
                }
            },
            {
                id: 'dormant',
                title: 'Dormant',
                value: 40,
                color: '#C1C7D0',
                flows: [
                    {
                        source: 'installed',
                        value: 40
                    }
                ],
                drop: {
                    title: 'Eval ended',
                    value: 35
                }
            }
        ]
    },
    {
        title: 'Revenue',
        buckets: [
            {
                title: 'Converted',
                value: 8,
                id: 'converted',
                color: '#36b37e',
                flows: [
                    {
                        source: 'active',
                        value: 5
                    },
                    {
                        source: 'dormant',
                        value: 2
                    },
                    {
                        source: 'silent',
                        value: 1
                    }
                ]
            }
        ]
    }
];
