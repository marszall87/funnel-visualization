import { h, render, Component } from 'preact';
import Portal from 'preact-portal';
import style from './style.css';
import Popper from 'popper.js';

class Popup extends Component {
    positionPopup(el) {
        if (!el) return;
        var anotherPopper = new Popper(this.props.triggerRef, el, {
            placement: 'right-start'
        });
    }

    render({ open, into = 'body', children }) {
        return open ? (
            <Portal into={into}>
                <div class={style.popup} ref={el => this.positionPopup(el)} visible={this.state.visible}>
                    {children}
                </div>
            </Portal>
        ) : null;
    }
}

class Bucket extends Component {
    constructor() {
        super();
        this.state = {
            showPopup: false
        };
        this.bucketElement = undefined;
    }

    togglePopup() {
        this.setState(state => ({ showPopup: !state.showPopup }));
    }

    componentDidMount() {
        this.bucketElement;
    }

    render({ bucket, opts }) {
        const { id, color, x, y, title, value, height, clients } = bucket;
        const { bucketWidth, borderRadius } = opts;
        return (
            <g
                ref={el => (this.bucketElement = el)}
                class={style.bucket}
                transform={`translate(${x} ${y})`}
                onClick={() => this.togglePopup()}
            >
                <rect
                    x={0}
                    y={-borderRadius}
                    width={bucketWidth}
                    height={height + 2 * borderRadius}
                    fill={color}
                    rx={borderRadius}
                    ry={borderRadius}
                />
                <g transform={`translate(${bucketWidth / 2} ${height / 2})`}>
                    <text alignment-baseline="baseline" text-anchor="middle" x={0} y={-3} stroke={color}>
                        {title}
                    </text>
                    <text
                        class={style.value}
                        alignment-baseline="hanging"
                        text-anchor="middle"
                        stroke={color}
                        x={0}
                        y={3}
                    >
                        {value}
                    </text>
                </g>
                {clients && clients.length > 0 ? (
                    <Popup open={this.state.showPopup} triggerRef={this.bucketElement}>
                        <h4>{title} clients</h4>
                        {clients.map(client => (
                            <p>
                                <span class={`${style.label} ${style.label}-${client.label}`}>{client.label}</span>{' '}
                                <a href={client.link}>{client.name}</a>
                            </p>
                        ))}
                    </Popup>
                ) : null}
            </g>
        );
    }
}

const Flow = ({ flow, opts }) => {
    const { from, to, height, fromOffset, toOffset, id, percent } = flow;
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

    const fontSize = height < 22 ? Math.max(height, 12) : 22;
    const labelRadius = 5;

    if (straight) {
        // draw a rectangle, because gradients don't work on straight lines o_O
        return (
            <g class={style.flow} transform={`translate(${x1} ${y1 - height / 2})`}>
                <rect x={0} y={0} width={width} height={height} fill={gradientUrl} />
                <rect x={0} y={0} width={width} height={height} fill="url(#flow-pattern)" />
                <rect
                    x={width / 2 - fontSize - labelRadius}
                    y={height / 2 - fontSize / 2 - labelRadius}
                    width={fontSize * 2 + labelRadius * 2}
                    height={fontSize + labelRadius * 2}
                    rx={labelRadius}
                    ry={labelRadius}
                    fill={gradientUrl}
                />
                <text
                    x={width / 2}
                    y={height / 2 + 1}
                    alignment-baseline="middle"
                    text-anchor="middle"
                    font-size={`${fontSize}px`}
                >
                    {Math.floor(percent * 100)}%
                </text>
            </g>
        );
    } else {
        const path = [
            `M ${0} ${y1}`,
            extension ? `L ${curveX} ${y1}` : '',
            `C ${curveX + width / radius} ${y1}, ${width - width / radius} ${y2}, ${width} ${y2}`
        ].join(' ');

        const textY = extension ? y1 : Math.min(y1, y2) + Math.abs(y1 - y2) / 2;

        return (
            <g class={style.flow} transform={`translate(${x1} 0)`}>
                <path d={path} fill="none" stroke={gradientUrl} stroke-width={height} />
                <path d={path} fill="none" stroke="url(#flow-pattern)" stroke-width={height} />
                <rect
                    x={width / 2 - fontSize - labelRadius}
                    y={textY - fontSize / 2 - labelRadius}
                    width={fontSize * 2 + labelRadius * 2}
                    height={fontSize + labelRadius * 2}
                    rx={labelRadius}
                    ry={labelRadius}
                    fill={gradientUrl}
                />
                <text
                    x={width / 2}
                    y={1}
                    transform={`translate(0 ${textY})`}
                    alignment-baseline="middle"
                    text-anchor="middle"
                    font-size={`${fontSize}px`}
                >
                    {Math.floor(percent * 100)}%
                </text>
            </g>
        );
    }
};

const Drop = ({ drop, opts }) => {
    const { from, height, title, percent } = drop;
    const { bucketWidth } = opts;

    const radius = 15;
    const padding = 10;

    const x = from.x + bucketWidth;
    const y = from.y + from.height - height + radius;

    const path = [`M 0 0`, `Q ${radius} 0, ${radius} ${radius}`].join(' ');

    return (
        <g transform={`translate(${x} ${y})`} class={style.drop}>
            <path fill="none" d={path} stroke-width={radius * 2} />
            <rect class={style.solid} x={0} y={radius} width={radius * 2} height={Math.max(height - radius, 0)} />
            <rect x={0} y={height} width={radius * 2} height={padding} fill="url(#funnel-gradient-drop)" />
            <rect x={0} y={-radius} width={radius * 2} height={height + padding + radius} fill="url(#drop-pattern)" />
            <text x={3} y={radius}>
                {Math.floor(percent * 100)}%
            </text>
        </g>
    );
};

const Step = ({ step, opts }) => {
    const { x, title } = step;
    const { height, bucketWidth, headerHeight, borderRadius } = opts;
    return (
        <g transform={`translate(${x} 0)`} class={style.step}>
            <line x1={0} y1={0} x2={0} y2={height} />
            <text text-anchor="middle" x={bucketWidth / 2} y={-borderRadius - 20}>
                {title}
            </text>
            <line x1={bucketWidth} y1={0} x2={bucketWidth} y2={height} />
        </g>
    );
};

const FlowGradient = ({ flow, opts }) => {
    const { bucketWidth } = opts;
    const id = `funnel-gradient-${flow.id}`;
    const { from, to } = flow;
    return (
        <linearGradient id={id} gradientUnits="userSpaceOnUse" x1="0" x2={bucketWidth} y1="0" y2="0">
            <stop class="funnel-gradient-start" stop-color={from.color} offset="0%" />
            <stop class="funnel-gradient-stop" stop-color={to.color} offset="100%" />
        </linearGradient>
    );
};

const layoutBuckets = (funnel, opts) => {
    const { bucketWidth, bucketMargin, height, yScale } = opts;

    return funnel.reduce((acc, step, stepIdx) => {
        const bucketCount = step.buckets.length;
        const stepBuckets = step.buckets.reduce((acc, bucket, bucketIdx) => {
            if (bucket.value === 0) return acc;
            const x = 2 * stepIdx * bucketWidth;
            const y = acc.reduce((sum, b) => sum + b.height + bucketMargin, 0);
            return [
                ...acc,
                {
                    ...bucket,
                    x,
                    y,
                    height: bucket.value * yScale
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
                        if (flow.value === 0) return acc;
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
            if (!bucket.drop || bucket.drop.value === 0) return acc;
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

class Funnel extends Component {
    constructor() {
        super();
        this.wrapper = undefined;
    }

    measureWrapper(el) {
        this.wrapper = el;
    }

    componentDidMount() {
        const { width, height } = this.wrapper.getBoundingClientRect();
        this.setState({
            width,
            height
        });
    }

    render() {
        const { funnel, headerHeight, borderRadius, bucketMargin } = this.props;
        const stepCount = funnel.length;
        const bucketWidth = this.state.width / (2 * stepCount - 1);

        const width = this.state.width;
        const height = this.state.height - headerHeight;

        const maxStepValueSum = funnel.reduce((max, step) => {
            const stepValueSum = step.buckets.reduce((sum, b) => sum + (b.value || 0), 0);
            return stepValueSum > max ? stepValueSum : max;
        }, 0);

        const yScale = (height - headerHeight) / maxStepValueSum;

        const opts = { headerHeight, borderRadius, bucketMargin, width, height, yScale, bucketWidth };

        const steps = layoutSteps(funnel, opts);
        const buckets = layoutBuckets(funnel, opts);
        const flows = layoutFlows(funnel, buckets, opts);
        const drops = layoutDrops(funnel, buckets, opts);

        return (
            <div class={style.wrapper} ref={el => this.measureWrapper(el)}>
                {width > 0 ? (
                    <svg class={style.svg}>
                        <defs>
                            {flows.map(f => (
                                <FlowGradient flow={f} opts={opts} />
                            ))}
                            <linearGradient
                                id="funnel-gradient-drop"
                                class="funnel-visualization-gradient-drop"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop class="funnel-visualization-gradient-start" offset="0%" />
                                <stop class="funnel-visualization-gradient-stop" offset="100%" />
                            </linearGradient>
                            <g id="arrows">
                                <g>
                                    <path
                                        d="M 0 -4 L 4 0 L 0 4"
                                        fill="none"
                                        stroke="white"
                                        stroke-width="1"
                                        opacity=".3"
                                    />
                                </g>
                                <g transform="translate(10, 10)">
                                    <path
                                        d="M 0 -4 L 4 0 L 0 4"
                                        fill="none"
                                        stroke="white"
                                        stroke-width="1"
                                        opacity=".3"
                                    />
                                </g>
                                <g transform="translate(0, 20)">
                                    <path
                                        d="M 0 -4 L 4 0 L 0 4"
                                        fill="none"
                                        stroke="white"
                                        stroke-width="1"
                                        opacity=".3"
                                    />
                                </g>
                            </g>
                            <pattern id="flow-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <animateTransform
                                    attributeType="xml"
                                    attributeName="patternTransform"
                                    type="translate"
                                    from="0 0"
                                    to="20 0"
                                    begin="0"
                                    dur="1s"
                                    repeatCount="indefinite"
                                />
                                <use href="#arrows" />
                            </pattern>
                            <pattern id="drop-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <animateTransform
                                    attributeType="xml"
                                    attributeName="patternTransform"
                                    type="translate"
                                    from="0 0"
                                    to="0 20"
                                    begin="0"
                                    dur="1s"
                                    repeatCount="indefinite"
                                />
                                <use href="#arrows" transform="rotate(90, 10, 10)" />
                            </pattern>
                        </defs>
                        <g transform={`translate(0, ${headerHeight})`}>
                            {buckets.map(b => (
                                <Bucket key={b.id} bucket={b} opts={opts} />
                            ))}
                        </g>
                        <g transform={`translate(0, ${headerHeight})`}>
                            {steps.map(s => (
                                <Step step={s} opts={opts} />
                            ))}
                        </g>
                        <g transform={`translate(0, ${headerHeight})`}>
                            {drops.map(d => (
                                <Drop drop={d} opts={opts} />
                            ))}
                        </g>
                        <g transform={`translate(0, ${headerHeight})`}>
                            {flows.map(f => (
                                <Flow key={f.id} flow={f} opts={opts} />
                            ))}
                        </g>
                    </svg>
                ) : null}
            </div>
        );
    }
}

export default ({ container, funnel }) => {
    const borderRadius = 0;
    const bucketMargin = 40;
    const headerHeight = 40 + borderRadius;

    const opts = {
        borderRadius,
        headerHeight,
        bucketMargin
    };

    render(<Funnel funnel={funnel} {...opts} />, container, container.querySelector(`.${style.wrapper}`));
};
