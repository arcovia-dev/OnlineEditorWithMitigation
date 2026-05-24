package org.dataflowanalysis.standalone.mitigation;

import java.io.IOException;
import java.util.stream.Collectors;

import org.dataflowanalysis.standalone.api.Servlet;
import org.dataflowanalysis.standalone.mitigation.approaches.ILPService;
import org.dataflowanalysis.standalone.mitigation.approaches.SATService;
import org.dataflowanalysis.standalone.mitigation.approaches.SMTService;
import org.sat4j.specs.ContradictionException;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class MitigationServlet extends Servlet{
    private MitigationService activeService;
    
    
    @Override    
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String pathInfo = request.getPathInfo();

        activeService = switch (pathInfo) {
            case "/smt" -> new SMTService();
            case "/sat" -> new SATService();
            case "/ilp" -> new ILPService();
            default -> throw new IllegalArgumentException("Unknown repair endpoint: " + pathInfo);
        };         
        
        String message = request.getReader()
                .lines()
                .collect(Collectors.joining(System.lineSeparator()));
        
        String name = message.split(":")[0];
        message = message.replaceFirst(name + ":", "");

        try {
            var result = doSpecific(message, name);            
            writeText(response, HttpServletResponse.SC_OK, name + ":" + result);
        } catch (IllegalArgumentException e) {
            writeText(response, HttpServletResponse.SC_BAD_REQUEST, e.getMessage());

        } catch (Exception e) {
            writeText(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Internal server error");
        }
    }
    
    protected String doSpecific(String message, String name){
        try {
            return activeService.repairDFD(message);
        
        }catch (ContradictionException e) {
            throw new IllegalArgumentException("Contradiction occured");
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Mitigation Failed with given paramters");
        }
    }
}
