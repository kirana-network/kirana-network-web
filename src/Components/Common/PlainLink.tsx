import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const PlainLink = styled(Link)`
    text-decoration: none;
    color: inherit;

    &:focus, &:hover, &:visited, &:link, &:active {
        text-decoration: none;
        color: inherit;
    }
`;

export default (props: any) => <PlainLink {...props} />;

