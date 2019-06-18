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

class WithPopup extends Component {
    constructor() {
        super();
        this.state = {
            showPopup: false
        };
        this.triggerElement = undefined;
    }

    togglePopup() {
        this.setState(state => ({ showPopup: !state.showPopup }));
    }

    componentDidMount() {
        this.triggerElement;
    }
}

class Bucket extends WithPopup {
    render({ bucket, opts }) {
        const { id, color, x, y, title, value, height, clients } = bucket;
        const { bucketWidth, borderRadius, interactive } = opts;
        return (
            <g
                ref={el => (this.triggerElement = el)}
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
                {interactive ? (
                    <Popup open={this.state.showPopup} triggerRef={this.triggerElement}>
                        <h4>{title}</h4>
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

class Flow extends WithPopup {
    render({ flow, opts }) {
        const { from, to, height, fromOffset, toOffset, id, percent, clients, title } = flow;
        const { bucketWidth, height: graphHeight, interactive } = opts;

        const x1 = from.x + bucketWidth;
        const x2 = to.x;
        const y1 = from.y + (fromOffset || 0) + height / 2;
        const y2 = to.y + (toOffset || 0) + height / 2;

        const width = Math.abs(x1 - x2);
        // const radius = 5 * (Math.abs(y1 - y2) / graphHeight) + 2;
        const radius = bucketWidth / 3;
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
                    <g class={style['popup-trigger']} onClick={() => this.togglePopup()}>
                        <rect
                            x={width / 2 - fontSize - labelRadius}
                            y={height / 2 - fontSize / 2 - labelRadius}
                            width={fontSize * 2 + labelRadius * 2}
                            height={fontSize + labelRadius * 2}
                            rx={labelRadius}
                            ry={labelRadius}
                            fill={gradientUrl}
                            ref={el => (this.triggerElement = el)}
                        />
                        <text
                            x={width / 2}
                            y={height / 2 + 1}
                            alignment-baseline="middle"
                            text-anchor="middle"
                            font-size={`${fontSize / 22}em`}
                        >
                            {Math.floor(percent * 100)}%
                        </text>
                    </g>
                    {interactive ? (
                        <Popup open={this.state.showPopup} triggerRef={this.triggerElement}>
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
        } else {
            const p1 = curveX + radius;
            const p2 = width - radius;
            const down = y1 < y2;
            const path = [
                `M ${0} ${y1}`,
                extension ? `L ${curveX} ${y1}` : '',
                `C ${down ? p1 : p2} ${y1}, ${down ? p2 : p1} ${y2}, ${width} ${y2}`
            ].join(' ');

            const textY = extension ? y1 : Math.min(y1, y2) + Math.abs(y1 - y2) / 2;

            return (
                <g class={style.flow} transform={`translate(${x1} 0)`}>
                    <path d={path} fill="none" stroke={gradientUrl} stroke-width={height} />
                    <path d={path} fill="none" stroke="url(#flow-pattern)" stroke-width={height} />
                    <g class={style['popup-trigger']} onClick={() => this.togglePopup()}>
                        <rect
                            x={width / 2 - fontSize - labelRadius}
                            y={textY - fontSize / 2 - labelRadius}
                            width={fontSize * 2 + labelRadius * 2}
                            height={fontSize + labelRadius * 2}
                            rx={labelRadius}
                            ry={labelRadius}
                            fill={gradientUrl}
                            ref={el => (this.triggerElement = el)}
                        />
                        <text
                            x={width / 2}
                            y={1}
                            transform={`translate(0 ${textY})`}
                            alignment-baseline="middle"
                            text-anchor="middle"
                            font-size={`${fontSize / 22}em`}
                        >
                            {Math.floor(percent * 100)}%
                        </text>
                    </g>
                    {interactive ? (
                        <Popup open={this.state.showPopup} triggerRef={this.triggerElement}>
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
}

class Drop extends WithPopup {
    render({ drop, opts }) {
        const { from, height, title, percent, clients } = drop;
        const { bucketWidth, interactive } = opts;

        const radius = Math.min(15, Math.floor(percent * 100));
        const padding = 10;

        const x = from.x + bucketWidth;
        const y = from.y + from.height - height + radius;

        const path = [`M 0 0`, `Q ${radius} 0, ${radius} ${radius}`].join(' ');

        return (
            <g transform={`translate(${x} ${y})`} class={style.drop}>
                <path fill="none" d={path} stroke-width={radius * 2} />
                <rect class={style.solid} x={0} y={radius} width={radius * 2} height={Math.max(height - radius, 0)} />
                <rect
                    x={0}
                    y={Math.max(height, radius)}
                    width={radius * 2}
                    height={padding}
                    fill="url(#funnel-gradient-drop)"
                />
                <rect
                    x={0}
                    y={-radius}
                    width={radius * 2}
                    height={height + padding + radius}
                    fill="url(#drop-pattern)"
                />
                <g
                    class={style['popup-trigger']}
                    onClick={() => this.togglePopup()}
                    ref={el => (this.triggerElement = el)}
                >
                    <text x={radius * 2 + 5} y={radius}>
                        {Math.floor(percent * 100)}%
                    </text>
                </g>
                {interactive ? (
                    <Popup open={this.state.showPopup} triggerRef={this.triggerElement}>
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
            const value = bucket.value || bucket.clients && bucket.clients.length;
            if (value === 0) return acc;
            const x = 2 * stepIdx * bucketWidth;
            const y = acc.reduce((sum, b) => sum + b.height + bucketMargin, 0);
            return [
                ...acc,
                {
                    ...bucket,
                    x,
                    y,
                    height: value * yScale,
                    value
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
                        const value = flow.value || flow.clients && flow.clients.length;
                        if (value === 0) return acc;
                        const from = buckets.find(b => b.id === flow.source);
                        const fromValue = from.value || from.clients && from.clients.length;
                        const height = value * yScale;
                        const fromOffset = from.fromOffset || 0;
                        const toOffset = to.toOffset || 0;
                        from.fromOffset = fromOffset + height;
                        to.toOffset = toOffset + height;
                        return [
                            ...acc,
                            {
                                ...flow,
                                id: `${from.id}-${to.id}`,
                                from,
                                to,
                                value: value,
                                percent: value / fromValue,
                                height,
                                fromOffset,
                                toOffset,
                                value
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
            const value = bucket.drop.value || bucket.drop.clients && bucket.drop.clients.length;
            if (!value) return acc;
            const bucketValue = bucket.value || bucket.clients && bucket.clients.length;
            return [
                ...acc,
                {
                    ...bucket.drop,
                    from,
                    value,
                    height: value * yScale,
                    title: bucket.drop.title,
                    percent: value / bucketValue
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
        const { funnel, headerHeight, borderRadius, bucketMargin, animate, interactive } = this.props;
        const stepCount = funnel.length;
        const bucketWidth = this.state.width / (2 * stepCount - 1);

        const width = this.state.width;
        const height = this.state.height - headerHeight;

        const yScale = funnel.reduce((min, step) => {
            const stepValueSum = step.buckets.reduce(
                (sum, bucket) => sum + ((bucket.entities && bucket.entities.length) || 0), 0
            );
            const margins = (step.buckets.length - 1) * bucketMargin;
            const yScale = Math.round((containerHeight - margins) / stepValueSum * 10) / 10;
            return yScale < min ? yScale : min;
        }, Number.POSITIVE_INFINITY);

        const opts = { headerHeight, borderRadius, bucketMargin, width, height, yScale, bucketWidth, interactive };

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
                                        d="M 0 0 L 4 4 L 0 8"
                                        fill="none"
                                        stroke="white"
                                        stroke-width="1"
                                        opacity="1"
                                    />
                                </g>
                                <g transform="translate(10, 10)">
                                    <path
                                        d="M 0 0 L 4 4 L 0 8"
                                        fill="none"
                                        stroke="white"
                                        stroke-width="1"
                                        opacity="1"
                                    />
                                </g>
                                <g transform="translate(0, 20)">
                                    <path
                                        d="M 0 0 L 4 4 L 0 8"
                                        fill="none"
                                        stroke="white"
                                        stroke-width="1"
                                        opacity="1"
                                    />
                                </g>
                            </g>
                            <pattern id="flow-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                {animate ? (
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
                                ) : null}
                                <use href="#arrows" />
                            </pattern>
                            <pattern id="drop-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                {animate ? (
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
                                ) : null}
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
                            {flows.map(f => (
                                <Flow key={f.id} flow={f} opts={opts} />
                            ))}
                        </g>
                        <g transform={`translate(0, ${headerHeight})`}>
                            {drops.map(d => (
                                <Drop drop={d} opts={opts} />
                            ))}
                        </g>
                    </svg>
                ) : null}
            </div>
        );
    }
}

export default ({ container, funnel, options = {} }) => {
    const { borderRadius = 0, bucketMargin = 40, animate = true, interactive = true } = options;
    const headerHeight = 40 + borderRadius;

    const opts = {
        borderRadius,
        headerHeight,
        bucketMargin,
        interactive,
        animate
    };

    render(<Funnel funnel={funnel} {...opts} />, container, container.querySelector(`.${style.wrapper}`));
};
