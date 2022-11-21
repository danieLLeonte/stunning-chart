import { useEffect, useMemo, useState } from "react";
import { Bar } from "@visx/shape";
import { scaleBand, scaleLinear } from "@visx/scale";
import { localPoint } from "@visx/event";
import { TooltipWithBounds, useTooltip, defaultStyles } from "@visx/tooltip";
import { AxisBottom, AxisLeft } from "@visx/axis";
import useMeasure from "react-use-measure";
import styled from "styled-components";
import { timeFormat } from "d3-time-format";
import { Group } from "@visx/group";

import { fetchFromAPI } from "../utils/fetchGraphQL";

const getYValue = (d) => d.posts;
const getXValue = (d) => d.date;

const Wrapper = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  position: relative;
  width: 600px;
  height: 400px;
  min-width: 300px;
`;

const tooltipStyles = {
  ...defaultStyles,
  borderRadius: 4,
  background: "black",
  color: "white",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const margin = 32;

const Chart = () => {
  const [ref, bounds] = useMeasure();
  const [data, setData] = useState([]);

  const width = bounds.width || 100;
  const height = bounds.height || 100;

  const innerWidth = width - margin;
  const innerHeight = height - margin;

  useEffect(() => {
    fetchFromAPI().then((data) => setData(data));
  }, [])

  const {
    showTooltip,
    hideTooltip,
    tooltipData,
    tooltipLeft = 0,
    tooltipTop = 0,
  } = useTooltip();

  const xScale = useMemo(
    () =>
      scaleBand({
        range: [margin, innerWidth],
        domain: data.map(getXValue),
        padding: 0.2,
      }),
    [data, innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        range: [innerHeight, margin],
        domain: [
          Math.min(...data.map(getYValue)) - 1,
          Math.max(...data.map(getYValue)) + 1,
        ],
      }),
    [data, innerHeight]
  );

  return (
    <Wrapper>
      <Container ref={ref}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          <Group>
            {data.map((d) => {
              const xValue = getXValue(d);
              const barWidth = xScale.bandwidth();
              const barHeight = innerHeight - (yScale(getYValue(d)) ?? 0);
              const barX = xScale(xValue);
              const barY = innerHeight - barHeight;

              return (
                <Bar
                  key={`bar-${xValue}`}
                  x={barX}
                  y={barY}
                  width={barWidth}
                  height={barHeight}
                  fill="orange"
                  onMouseMove={(
                    event
                  ) => {
                    const point = localPoint(event);

                    if (!point) return;

                    showTooltip({
                      tooltipData: d,
                      tooltipTop: point.y,
                      tooltipLeft: point.x,
                    });
                  }}
                  onMouseLeave={() => hideTooltip()}
                />
              );
            })}
          </Group>

          <Group>
            <AxisBottom
              tickStroke="white"
              stroke="white"
              tickClassName="gclass"
              top={innerHeight}
              scale={xScale}
              tickFormat={(date) => timeFormat("%b")(new Date(date))}
            />
          </Group>

          <Group>
            <AxisLeft
              tickStroke="white"
              stroke="white"
              tickClassName="gclass"
              left={margin}
              scale={yScale} />
          </Group>
        </svg>

        {tooltipData ? (
          <TooltipWithBounds
            key={Math.random()}
            top={tooltipTop}
            left={tooltipLeft}
            style={tooltipStyles}
          >
            <b>{`${timeFormat("%b, %Y")(
              new Date(getXValue(tooltipData))
            )}`}</b>
            : {getYValue(tooltipData)}
          </TooltipWithBounds>
        ) : null}
      </Container>
    </Wrapper>
  );
};

export default Chart;