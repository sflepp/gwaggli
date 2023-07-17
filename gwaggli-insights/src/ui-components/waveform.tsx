import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import WaveSurfer from 'wavesurfer.js';
import styled from 'styled-components';
import { FaPlayCircle, FaPauseCircle } from 'react-icons/fa';

// https://github.com/andreidobrinski/react-wavesurfer-demo
const Waveform = ({ audio }: { audio: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const waveSurferRef = useRef<WaveSurfer>(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        {
            isPlaying: () => false,
        }
    );
    const [isPlaying, toggleIsPlaying] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        const waveSurfer = WaveSurfer.create({
            container: containerRef.current,
            responsive: true,
            barWidth: 2,
            barHeight: 2,
            cursorWidth: 0,
            height: 40,
        });
        waveSurfer.load(audio);
        waveSurfer.on('ready', () => {
            waveSurferRef.current = waveSurfer;
        });

        return () => {
            waveSurfer.destroy();
        };
    }, [audio]);

    return (
        <WaveSurferWrap>
            <button
                onClick={() => {
                    waveSurferRef.current.playPause();
                    toggleIsPlaying(waveSurferRef.current.isPlaying());
                }}
                type="button"
            >
                {isPlaying ? <FaPauseCircle size="20px" /> : <FaPlayCircle size="20px" />}
            </button>
            <div ref={containerRef} />
        </WaveSurferWrap>
    );
};

Waveform.propTypes = {
    audio: PropTypes.string.isRequired,
};

const WaveSurferWrap = styled.div`
    margin: 0 0.2em;
    padding-inline: 0.4em;
    padding-block: 0.2em 0.1em;
    background: rgba(150, 150, 150, 0.1);
    border: 1px solid rgba(100, 100, 100, 0.2);
    border-radius: 3px;
    display: grid;
    grid-template-columns: 30px 550px;
    align-items: center;

    width: 600px;

    button {
        width: 20px;
        height: 20px;
        border: none;
        padding: 0;
        background-color: white;
    }
`;

export default Waveform;
