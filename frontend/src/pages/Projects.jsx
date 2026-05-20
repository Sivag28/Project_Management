import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProjects, createProject } from "../redux/projectSlice";
import ProjectCard from "../components/ProjectCard";

const Projects = () => {
  const dispatch = useDispatch();
  const projects = useSelector((s) => s.projects);

  useEffect(() => {
    dispatch(fetchProjects());
  }, []);

  return (
    <div className="p-8 grid grid-cols-3 gap-6">
      <button
        onClick={() =>
          dispatch(createProject({ title: "New Project", description: "Demo" }))
        }
        className="bg-primary text-white rounded-lg p-4"
      >
        + Create Project
      </button>

      {projects.map((p) => (
        <ProjectCard key={p._id} project={p} />
      ))}
    </div>
  );
};

export default Projects;
