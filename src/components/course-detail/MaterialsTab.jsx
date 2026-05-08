import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Download, Plus, BookOpen } from "lucide-react";
import { format } from "date-fns";

const typeIcons = {
  notes: "📝", past_exam: "📋", formula_sheet: "📐", recording: "🎥", other: "📎"
};

export default function MaterialsTab({ courseId }) {
  const queryClient = useQueryClient();

  const { data: materials = [] } = useQuery({
    queryKey: ["materials", courseId],
    queryFn: () => base44.entities.StudyMaterial.filter({ course_id: courseId }, "-created_date", 50),
  });

  const uploadMaterial = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.StudyMaterial.create({
        course_id: courseId,
        name: file.name,
        file_url,
        type: "notes",
      });
      queryClient.invalidateQueries({ queryKey: ["materials", courseId] });
    };
    input.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Course Materials</h3>
        <Button size="sm" variant="outline" onClick={uploadMaterial} className="rounded-xl">
          <Upload className="h-4 w-4 mr-1" /> Upload
        </Button>
      </div>

      {materials.length === 0 ? (
        <Card className="p-12 rounded-2xl text-center">
          <BookOpen className="h-10 w-10 mx-auto text-muted-foreground/30 mb-4" />
          <h3 className="font-medium mb-1">No materials yet</h3>
          <p className="text-sm text-muted-foreground">Upload notes, past exams, or formula sheets.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {materials.map((m) => (
            <Card key={m.id} className="p-4 rounded-2xl flex items-center gap-3 hover:shadow-md transition-shadow">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg">
                {typeIcons[m.type] || "📎"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px]">{m.type?.replace("_", " ")}</Badge>
                  {m.created_date && <span className="text-[10px] text-muted-foreground">{format(new Date(m.created_date), "MMM d")}</span>}
                </div>
              </div>
              {m.file_url && (
                <a href={m.file_url} target="_blank" rel="noopener noreferrer">
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Download className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}