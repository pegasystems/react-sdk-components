import React from "react";
import PropTypes from "prop-types";

import TwoColumn from '../TwoColumn/TwoColumn';

/*
 * The wrapper handles knowing how to take in just children
 *  and mapping to the TwoColumn template.
 */
export default function TwoColumnPage(props) {

  return (
    <TwoColumn
      {...props}
    />
  );
}

TwoColumnPage.propTypes = {
  children: PropTypes.arrayOf(PropTypes.node).isRequired,
};

TwoColumnPage.defaultProps = {
};
