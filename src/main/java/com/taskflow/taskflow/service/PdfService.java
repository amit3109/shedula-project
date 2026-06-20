package com.taskflow.taskflow.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;

@Service
public class PdfService {
    // Add this method inside your PdfService.java to pull real stats
    public byte[] generateProjectReport(String projectName, int total, int done) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Style the report
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            document.add(new Paragraph("Shedula Project Report: " + projectName, titleFont));
            document.add(new Paragraph("--------------------------------------------------"));
            document.add(new Paragraph("Total Tasks: " + total));
            document.add(new Paragraph("Tasks Completed: " + done));
            document.add(new Paragraph("Completion Rate: " + (total > 0 ? (done * 100 / total) : 0) + "%"));

            document.close();
        } catch (Exception e) {
            e.printStackTrace();
        }
        return out.toByteArray();
    }
}