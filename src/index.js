import html from 'hyperhtml/esm';
import style from './style.css';

const bucket = (props, opts) => {
    const { id } = props;
    const { bucketWidth } = opts;
    return html(props, 'svg')`
        <g class=${`${style.bucket} ${style.bucket + '-' + id}`} transform=${`translate(${props.x} ${props.y})`}>
            <rect x=0 y=0 width=${bucketWidth} height=${props.height}/>
            <g transform=${`translate(${bucketWidth / 2} ${props.height / 2})`}>
                <text alignment-baseline="baseline" text-anchor="middle" x=0 y=-2>${props.title}</text>
                <text class=${style.value} alignment-baseline="hanging" text-anchor="middle" x=0 y=2>${
        props.value
    }</text>
            </g>
        </g> 
    `;
};

const flow = (props, opts) => {
    const { from, to, height, fromOffset, toOffset, id } = props;
    const { bucketWidth } = opts;

    const x1 = from.x + bucketWidth;
    const x2 = to.x;
    const y1 = from.y + (fromOffset || 0) + height / 2;
    const y2 = to.y + (toOffset || 0) + height / 2;

    const width = Math.abs(x1 - x2);

    const radius = 5;

    const straight = y1 === y2;

    const extension = width > 2 * bucketWidth;
    const curveX = extension ? x1 + width - bucketWidth : x1;

    const gradientUrl = `url(#funnel-gradient-${id})`;
    if (straight) {
        // draw a rectangle, because gradients don't work on straight lines o_O
        return html(props, 'svg')`
            <rect class=${style.flow} x=${x1} y=${y1 - height / 2} width=${width} height=${height} fill=${gradientUrl}>
        `;
    } else {
        const path = [
            `M ${x1} ${y1}`,
            extension ? `L ${curveX} ${y1}` : '',
            `C ${curveX + width / (radius - 0.2)} ${y1}, ${x2 - width / radius} ${y2}, ${x2} ${y2}`
        ].join(' ');

        return html(props, 'svg')`
        <path class=${`${style.flow} ${style.flow +
            '-' +
            id}`} d="${path}" fill="none" stroke=${gradientUrl} stroke-width=${height}/>
    `;
    }
};

const drop = (props, opts) => {
    const { from, height, title } = props;
    const { bucketWidth } = opts;

    const radius = 15;
    const padding = 10;

    const x = from.x + bucketWidth;
    const y = from.y + from.height - height + radius;

    const path = [`M 0 0`, `Q ${radius} 0, ${radius} ${radius}`].join(' ');

    return html(props, 'svg')`
        <g transform=${`translate(${x} ${y})`} class=${style.drop}>
            <path fill="none" d="${path}" stroke-width=${radius * 2}/>
            <rect class=${style.solid} x=0 y=${radius} width=${radius * 2} height=${height} />
            <rect x=0 y=${height + radius} width=${radius * 2} height=${padding} fill="url(#funnel-gradient-drop)" />
            <text x=5 y=${height + padding + 2 * radius}>${title}</text>
        </g>
    `;
};

const step = (props, opts) => {
    const { x, title } = props;
    const { height, bucketWidth, headerHeight } = opts;
    return html(props, 'svg')`
        <g transform=${`translate(${x} 0)`} class=${style.step}>
            <line x1=${0} y1=${0} x2=${0} y2=${height}/>
            <text text-anchor="middle" x=${bucketWidth / 2} y=${-headerHeight / 2}>${title}</text>
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
                    title: bucket.drop.title
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

const flowGradient = flow => {
    const id = `funnel-gradient-${flow.id}`;
    return html(flow, 'svg')`
        <linearGradient id=${id} class=${id}>
            <stop class="funnel-gradient-start" offset="0%"/>
            <stop class="funnel-gradient-stop" offset="100%"/>
        </linearGradient>
    `;
};

export default ({ container, funnel = f }) => {
    const stepCount = funnel.length;
    const { width, height } = measureContainer(container);
    const bucketWidth = width / (2 * stepCount - 1);
    const headerHeight = 50;

    const maxStepValueSum = funnel.reduce((max, step) => {
        const stepValueSum = step.buckets.reduce((sum, b) => sum + b.value + ((b.drop && b.drop.value) || 0), 0);
        return stepValueSum > max ? stepValueSum : max;
    }, 0);

    const yScale = (height - headerHeight) / maxStepValueSum;

    const opts = { bucketWidth, width, headerHeight, height: height - headerHeight, yScale, bucketMargin: 20 };

    const steps = layoutSteps(funnel, opts);
    const buckets = layoutBuckets(funnel, opts);
    const flows = layoutFlows(funnel, buckets, opts);
    const drops = layoutDrops(funnel, buckets, opts);

    html(container)`
        <div class=${style.wrapper}>
            <svg class=${style.svg}>
            <defs>
                ${flows.map(f => flowGradient(f))}
                <linearGradient id="funnel-gradient-drop" class="funnel-gradient-drop" x1="0" y1="0" x2="0" y2="1">
                    <stop class="funnel-gradient-start" offset="0%"/>
                    <stop class="funnel-gradient-stop" offset="100%"/>
                </linearGradient>
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
        title: 'Evaluations',
        buckets: [
            {
                id: 'evaluator',
                title: 'Evaluator',
                value: 100,
                drop: {
                    title: 'Never installed',
                    value: 20
                }
            }
        ]
    },
    {
        title: 'Installation',
        buckets: [
            {
                id: 'installed',
                title: 'Installed',
                value: 70,
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
        title: 'Usage',
        buckets: [
            {
                id: 'active',
                title: 'Active',
                value: 20,
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
        title: 'Conversion',
        buckets: [
            {
                title: 'Converted',
                value: 8,
                id: 'converted',
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
