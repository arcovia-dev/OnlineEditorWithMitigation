package org.dataflowanalysis.standalone.mitigation;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record MitigationOption(String id, String type, String typeOfLabel, List<LabelTypeAndValue> labels, String forConstraint) {

}