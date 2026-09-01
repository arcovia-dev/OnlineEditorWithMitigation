package org.dataflowanalysis.standalone.mitigation.approaches;

import java.io.IOException;
import java.util.List;

import org.dataflowanalysis.analysis.dsl.AnalysisConstraint;
import org.dataflowanalysis.converter.dfd2web.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.standalone.mitigation.MitigationOption;
import org.dataflowanalysis.standalone.mitigation.MitigationService;
import org.sat4j.specs.ContradictionException;
import org.sat4j.specs.TimeoutException;

import dev.arcovia.mitigation.sat.Mechanic;
import dev.arcovia.mitigation.sat.dsl.CNFTranslation;

public class SATService extends MitigationService{  
    
    protected DataFlowDiagramAndDictionary repair(DataFlowDiagramAndDictionary dd, List<AnalysisConstraint> constraints, List<MitigationOption> options) throws ContradictionException, TimeoutException, IOException {
        var converted = constraints.stream()
                .map(CNFTranslation::new)
                .map(CNFTranslation::constructCNF)
                .flatMap(List::stream)
                .toList();
        
        Mechanic mechanic = new Mechanic(dd, null, converted);
        return mechanic.repair();  
    }
}
