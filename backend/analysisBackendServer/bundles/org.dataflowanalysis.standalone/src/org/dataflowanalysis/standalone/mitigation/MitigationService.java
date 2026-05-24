package org.dataflowanalysis.standalone.mitigation;

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
import org.dataflowanalysis.converter.web2dfd.model.Child;


import org.dataflowanalysis.standalone.services.Util;

public abstract class MitigationService {
    public static final String MITIGATION_INFO_SEPERATOR = ":MITIGATION_META_INFO:";
    
    public String repairDFD (String diagramMessage) throws Exception {
        var webEditorDfd = Util.deserializeJson(diagramMessage);
        var webEditorconverter = new Web2DFDConverter();
         var dd = webEditorconverter.convert(new WebEditorConverterModel(webEditorDfd));
         var constraints = Util.parseConstraints(webEditorDfd);
         
         DataFlowDiagramAndDictionary newDD = repair(dd, constraints);
        
         var dfdConverter = new DFD2WebConverter();
         dfdConverter.setConstraints(constraints);
         var newJson = dfdConverter.convert(newDD).getModel();
         
         StringBuilder mitigationInfo = new StringBuilder();
         
         for (var child : newJson.model().children()) {
             if (child.type().startsWith("node") && child.annotations() != null) {
                 var oldNode = webEditorDfd.model().children().stream().filter(node -> node.id().equals(child.id())).findAny();
                 if (oldNode.isPresent()) {
                     var RealOldNode = oldNode.get();
                     var map = compareNodesAndFindDifferences(child, RealOldNode);
                     map.forEach((port, message) -> {
                        mitigationInfo.append(port.id() + ":" + message + ";"); 
                        child.annotations().add(new Annotation("Mitigation:" + message, "bolt", "#FFFFFF", 0));
                     });      
                 } else {
                     child.annotations().add(new Annotation("Mitigation: Node added for Mitigation", "bolt", "#68e362", 0)); //TODO TFG Number
                 }
             }
         }    
         
         newJson.constraints().addAll(webEditorDfd.constraints()); 
         
         
         
         return Util.serializeJson(newJson) + ":MITIGATION_META_INFO:" + mitigationInfo.toString();
     }
    
    private Map<Port,String> compareNodesAndFindDifferences(Child newNode, Child oldNode) {
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
    
    protected abstract DataFlowDiagramAndDictionary repair(DataFlowDiagramAndDictionary dd, List<AnalysisConstraint> constraints) throws Exception;
}
