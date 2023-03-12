import {Typography} from "antd";
import styled from "styled-components";

const UuidVisualize = ({uuid}: { uuid: string }) => {
    const firstChars = uuid.substring(0, 6);

    return <>
        <Typography.Text code> <UuidColorSquare color={firstChars}></UuidColorSquare> {firstChars}</Typography.Text>
    </>
}

const UuidColorSquare = styled.span`
  background-color: #${props => props.color};
  display: inline-block;
  width: 1em;
  height: 1em;
  position: relative;
  top: 0.1em;
`;

export default UuidVisualize;