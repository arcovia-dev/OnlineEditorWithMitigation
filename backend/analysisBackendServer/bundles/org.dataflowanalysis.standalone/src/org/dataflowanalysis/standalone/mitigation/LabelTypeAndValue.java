package org.dataflowanalysis.standalone.mitigation;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record LabelTypeAndValue(String labelType, String label) {

}