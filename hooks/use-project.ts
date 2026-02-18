import { useState, useEffect } from 'react';
import type { Project } from '@/lib/mock-data';

export function useProject(id: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
    }
  }, [id]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/projects/${id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else if (response.status === 404) {
        setError('Projeto não encontrado');
      } else {
        setError('Erro ao carregar projeto');
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    project,
    loading,
    error,
    fetchProject,
  };
}
