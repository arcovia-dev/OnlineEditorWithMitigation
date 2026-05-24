package org.dataflowanalysis.standalone.mitigation.approaches;

import java.util.List;

import org.dataflowanalysis.analysis.dsl.AnalysisConstraint;
import org.dataflowanalysis.converter.dfd2web.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.standalone.mitigation.MitigationService;
import dev.arcovia.mitigation.ilp.OptimizationManager;

public class ILPService extends MitigationService{
    protected DataFlowDiagramAndDictionary repair(DataFlowDiagramAndDictionary dd, List<AnalysisConstraint> constraints) throws Exception {
        var optimization = new OptimizationManager(dd, constraints);
        return optimization.repair();
    }
}
