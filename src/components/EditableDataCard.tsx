import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Edit2, Save, X, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditableField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'date';
  value: any;
  options?: { value: string; label: string }[];
  required?: boolean;
}

interface EditableDataCardProps {
  title: string;
  fields: EditableField[];
  onSave: (updatedData: Record<string, any>) => Promise<void>;
  canEdit?: boolean;
  className?: string;
}

export const EditableDataCard: React.FC<EditableDataCardProps> = ({
  title,
  fields,
  onSave,
  canEdit = true,
  className = ""
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const handleEdit = () => {
    const initialData: Record<string, any> = {};
    fields.forEach(field => {
      initialData[field.key] = field.value;
    });
    setEditedData(initialData);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedData({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editedData);
      setIsEditing(false);
      setEditedData({});
      toast({
        title: "Sucesso",
        description: "Dados atualizados com sucesso!",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: string, value: any) => {
    setEditedData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const formatDisplayValue = (field: EditableField) => {
    if (field.value === null || field.value === undefined) return 'Não informado';
    
    switch (field.type) {
      case 'date':
        return field.value ? new Date(field.value).toLocaleDateString('pt-BR') : 'Não informado';
      case 'select':
        const option = field.options?.find(opt => opt.value === field.value);
        return option ? option.label : field.value;
      case 'number':
        return field.value.toLocaleString('pt-BR');
      default:
        return field.value;
    }
  };

  const renderEditField = (field: EditableField) => {
    const value = editedData[field.key] ?? field.value;

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.label}
            className="min-h-[80px]"
          />
        );
      
      case 'select':
        return (
          <Select value={value || ''} onValueChange={(val) => updateField(field.key, val)}>
            <SelectTrigger>
              <SelectValue placeholder={`Selecione ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'date':
        return (
          <Input
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => updateField(field.key, e.target.value)}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateField(field.key, parseFloat(e.target.value) || 0)}
            placeholder={field.label}
          />
        );
      
      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => updateField(field.key, e.target.value)}
            placeholder={field.label}
          />
        );
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {canEdit && !isEditing && (
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCancel}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              
              {isEditing ? (
                renderEditField(field)
              ) : (
                <div className="min-h-[40px] flex items-center">
                  <p className="text-sm">
                    {formatDisplayValue(field)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};