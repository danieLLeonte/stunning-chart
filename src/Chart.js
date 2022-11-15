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
import axios from "axios";

let array = [];

const endpoint = 'https://fakerql.goosfraba.ro/graphql';

const graphqlQuery = `query allPosts {
  allPosts(count: 100) {
    id
    createdAt
  }
}`;

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
    axios({
      url: endpoint,
      method: 'post',
      data: {
        query: graphqlQuery
      }
    }).then((result) => {
      let posts = {}
      let postsDate = {}

      result.data.data.allPosts.forEach((element, idx) => {
        let dateStr = new Date(element.createdAt / 1).toDateString();
        let dateStrArr = dateStr.split(' ');

        if (dateStrArr[3] === "2019") {
          // we create key/value pairs of type - key(month): value:=(number of posts)
          if(!posts[dateStrArr[1]]) {
            posts[dateStrArr[1]] = 0;

            // we also save the data separately in iso format to use it in the graph
            postsDate[idx] = new Date(element.createdAt / 1).toISOString();
          }

          posts[dateStrArr[1]] += 1;
        }
      });
    
      // we add each key/value pair to the array and save them as a new object
      for (const [key, value] of Object.entries(posts)) {
        array.push({date: key, posts: value})
      }

      // to each object in the array with ["date"] key we assign the date in iso format
      array.map((element, idx) => element["date"] = Object.entries(postsDate)[idx][1])
      
      array = array.sort((a,b) => Date.parse(a.date) - Date.parse(b.date));

      setData(array);
    });
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
              top={innerHeight}
              scale={xScale}
              tickFormat={(date) => timeFormat("%b")(new Date(date))}
            />
          </Group>

          <Group>
            <AxisLeft left={margin} scale={yScale} />
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