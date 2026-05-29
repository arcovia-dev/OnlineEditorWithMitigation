package org.dataflowanalysis.standalone.mitigation;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.dataflowanalysis.analysis.dsl.AnalysisConstraint;
import org.dataflowanalysis.converter.dfd2web.DFD2WebConverter;
import org.dataflowanalysis.converter.dfd2web.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.converter.web2dfd.Web2DFDConverter;
import org.dataflowanalysis.converter.web2dfd.WebEditorConverterModel;
import org.dataflowanalysis.converter.web2dfd.model.Annotation;
import org.dataflowanalysis.converter.web2dfd.model.Port;
import org.dataflowanalysis.converter.web2dfd.model.WebEditorDfd;
import org.dataflowanalysis.converter.web2dfd.model.WebEditorLabel;
import org.dataflowanalysis.dfd.datadictionary.Label;
import org.dataflowanalysis.converter.web2dfd.model.Child;


import org.dataflowanalysis.standalone.services.Util;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JavaType;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public abstract class MitigationService {
    public static final String MITIGATION_INFO_SEPERATOR = ":MITIGATION_META_INFO:";
    
    public String repairDFD (String diagramMessage) throws Exception {
        var repairRequest = deserializeJson(diagramMessage);        
        var webEditorDfd = Util.deserializeJson(repairRequest.diagram());
        var mitigationOptions = deserializeMitigationOptions(repairRequest.mitigations());
        
        var webEditorconverter = new Web2DFDConverter();
         var dd = webEditorconverter.convert(new WebEditorConverterModel(webEditorDfd));
         var constraints = Util.parseConstraints(webEditorDfd);
         
         DataFlowDiagramAndDictionary newDD = repair(dd, constraints, mitigationOptions);
        
         var dfdConverter = new DFD2WebConverter();
         dfdConverter.setConstraints(constraints);
         var newJson = dfdConverter.convert(newDD).getModel();
         
         StringBuilder mitigationInfo = new StringBuilder();
         
         for (var child : newJson.model().children()) {
             if (child.type().startsWith("node") && child.annotations() != null) {
                 var oldNode = webEditorDfd.model().children().stream().filter(node -> node.id().equals(child.id())).findAny();
                 if (oldNode.isPresent()) {
                     var RealOldNode = oldNode.get();
                     var map = compareNodePortsAndFindDifferences(child, RealOldNode);
                     map.forEach((port, message) -> {
                        mitigationInfo.append(port.id() + ":" + message + ";"); 
                        child.annotations().add(new Annotation("Mitigation:" + message, "bolt", "#FFFFFF", 0));
                     });  
                     var labelAdjustments = compareNodeLabelsAndFindDifference(child, RealOldNode, dd);
                     labelAdjustments.forEach(message -> {
                         child.annotations().add(new Annotation("Mitigation:" + message, "bolt", "#68e362", 0));
                     });
                     
                 } else {
                     child.annotations().add(new Annotation("Mitigation: Node added for Mitigation", "bolt", "#68e362", 0)); //TODO TFG Number
                 }
             }
         }    
         
         newJson.constraints().addAll(webEditorDfd.constraints()); 
         
         
         
         return Util.serializeJson(newJson) + ":MITIGATION_META_INFO:" + mitigationInfo.toString();
     }
    
    private Map<Port,String> compareNodePortsAndFindDifferences(Child newNode, Child oldNode) {
        var map = new HashMap<Port, String>();
        
        newNode.ports().forEach(port -> {
            if(port.behavior() != null) {
                var matchingPortOptional = oldNode.ports().stream().filter(oldPort -> oldPort.id().equals(port.id())).findAny();
                if (matchingPortOptional.isPresent()) {                
                    var matchingPort = matchingPortOptional.get();                
                    var newAssignments = Arrays.stream(port.behavior().split("\n")).map(assignment -> assignment.trim()).toList();
                    var oldAssignments = Arrays.stream(matchingPort.behavior().split("\n")).map(assignment -> assignment.trim()).toList();
                    
                    var addedAssignments = newAssignments.stream()
                            .filter(assignment -> !oldAssignments.contains(assignment))
                            .toList();
    
                    var removedAssignments = oldAssignments.stream()
                            .filter(assignment -> !newAssignments.contains(assignment))
                            .toList();
    
                    StringBuilder message = new StringBuilder();
    
                    addedAssignments.forEach(assignment ->
                            message.append("Added: ")
                                    .append(assignment)
                                    .append("\n")
                    );
    
                    removedAssignments.forEach(assignment ->
                            message.append("Removed: ")
                                    .append(assignment)
                                    .append("\n")
                    );
    
                    
                    if (!message.isEmpty()) {
                        map.put(port, message.toString().trim());
                    }
                }
            }
        });        
        return map;
    }
    
    private List<String> compareNodeLabelsAndFindDifference(Child newNode, Child oldNode, DataFlowDiagramAndDictionary dd) {
        List<String> messages = new ArrayList<>();
        
        var newNodeLabels = newNode.labels();
        var oldNodeLabels = oldNode.labels();
        
        var addedLabelsString = newNodeLabels.stream()
                .filter(label -> !oldNodeLabels.contains(label))
                .map(label -> getLabelStringFromId(label, dd))
                .toList();

        var removedLabelsString = oldNodeLabels.stream()
                .filter(label -> !newNodeLabels.contains(label))
                .map(label -> getLabelStringFromId(label, dd))
                .toList();
        
        addedLabelsString.forEach(label ->
            messages.add("Added Node Label: " + label)
        );
        
        removedLabelsString.forEach(label ->
            messages.add("Removed Node Label: " + label)
        );
        
        return messages;
    }
    
    private String getLabelStringFromId(WebEditorLabel webLabel, DataFlowDiagramAndDictionary dd) {
        var labelTypes = dd.dataDictionary().getLabelTypes();
        try {
            var labelType = labelTypes.stream().filter(type -> type.getId().equals(webLabel.labelTypeId())).findFirst().get();
            var label = labelType.getLabel().stream().filter(l -> l.getId().equals(webLabel.labelTypeValueId())).findFirst().get();
            return labelType.getEntityName() + ":" + label.getEntityName();
        } catch (Exception e) {
           throw new IllegalArgumentException("Unknown Label added or removed");
        }        
    }
    
    /**
     * Deserializes WebDFD
     * @param json Serialized WebDFD
     * @return Deserialized WebDFD
     */
    private RepairRequest deserializeJson(String json){
        var objectMapper = new ObjectMapper();
        RepairRequest repairRequest;
        try {
            repairRequest = objectMapper.readValue(json, RepairRequest.class);
        } catch (IOException e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Invalid Json Model");
        } 
        objectMapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);
        return repairRequest;
    }
    
    private List<MitigationOption> deserializeMitigationOptions(String json) {
        var objectMapper = new ObjectMapper();
        JavaType listType = objectMapper
                .getTypeFactory()
                .constructCollectionType(List.class, MitigationOption.class);

            try {
                return objectMapper.readValue(json, listType);
            } catch (Exception e) {
                e.printStackTrace();
                throw new IllegalArgumentException("Invalid Json Model");
            } 
    }
    
    protected abstract DataFlowDiagramAndDictionary repair(DataFlowDiagramAndDictionary dd, List<AnalysisConstraint> constraints, List<MitigationOption> options) throws Exception;
}
