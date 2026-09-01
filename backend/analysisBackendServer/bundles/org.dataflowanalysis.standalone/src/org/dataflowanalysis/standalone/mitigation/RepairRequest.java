package org.dataflowanalysis.standalone.mitigation;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record RepairRequest(String diagram, String mitigations) {

}