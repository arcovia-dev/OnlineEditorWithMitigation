package org.dataflowanalysis.standalone.mitigation.approaches;

import java.util.List;

import org.dataflowanalysis.analysis.dsl.AnalysisConstraint;
import org.dataflowanalysis.converter.dfd2web.DataFlowDiagramAndDictionary;
import org.dataflowanalysis.standalone.mitigation.MitigationService;

import dev.arcovia.mitigation.smt.Mitigation;
import tools.mdsd.library.standalone.initialization.StandaloneInitializationException;

public class SMTService extends MitigationService{
    protected DataFlowDiagramAndDictionary repair(DataFlowDiagramAndDictionary dd, List<AnalysisConstraint> constraints) throws StandaloneInitializationException {
        var mitigationResult = Mitigation.run(dd, constraints, null);
        return mitigationResult.repairedDFD();
    }
}
