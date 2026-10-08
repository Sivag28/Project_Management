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
    <div className="projects-page min-h-screen p-6 md:p-10">
      <div className="mx-auto max-w-7xl">
        <header className="projects-page-header mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em]">Workspace</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Projects</h1>
            <p className="mt-2 text-base">Keep your team’s work organized and moving forward.</p>
          </div>
          <button
            onClick={() =>
              dispatch(createProject({ title: "New Project", description: "Demo" }))
            }
            className="projects-create-button rounded-xl px-5 py-3 font-semibold text-white"
          >
            + Create Project
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p._id} project={p} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;
