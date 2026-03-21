import { useState } from "react";
import Button from "../../components/UI/Button";
import { Plus } from "lucide-react";
import Modal from "../../components/UI/Model";
import Input from "../../components/UI/Input";
import Dropdown from "../../components/UI/Dropdown";

const tabs = [
    { key: "all", label: "All Tasks" },
    { key: "my", label: "My Tasks" },
    { key: "archived", label: "Archived" },
];
export const tasksData = [
    {
      id: 1,
      projectName: "Website Redesign",
      description: "Revamp the landing page UI with modern design and improved UX.",
      priority: "High",
      assignedTo: "John Doe",
    },
    {
      id: 2,
      projectName: "Mobile App",
      description: "Fix login authentication issues and improve performance.",
      priority: "Medium",
      assignedTo: "Jane Smith",
    },
    {
      id: 3,
      projectName: "Dashboard Analytics",
      description: "Add charts and graphs for user activity tracking.",
      priority: "High",
      assignedTo: "Michael Chen",
    },
    {
      id: 4,
      projectName: "HR Management System",
      description: "Implement employee leave management module.",
      priority: "Low",
      assignedTo: "Sarah Johnson",
    },
    {
      id: 5,
      projectName: "E-commerce Platform",
      description: "Integrate payment gateway and optimize checkout flow.",
      priority: "High",
      assignedTo: "David Williams",
    },
]

const TasksTabs = () => {
    const [activeTab, setActiveTab] = useState("all");
    const [isOpen, setIsOpen] = useState(false);
    const [project, setProject] = useState("");
    const [priority, setPriority] = useState("");
    const [assignTo, setAssignTo] = useState("");
    const [taskName, setTaskName] = useState("");
    const [taskNameError, setTaskNameError] = useState("");
    return (
        <div className="mt-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex flex-col ">
                    <h1 className="text-2xl font-bold">Tasks</h1>
                    <p className="text-gray-500">Manage your tasks and projects</p>
                </div>
                <div>
                    <Button
                        onClick={() => setIsOpen(true)}
                        variant="primary" className="" type="button">< Plus size={16} /> Add Task</Button>
                </div>
            </div>
            <div className="relative inline-flex bg-gray-100 p-1 shadow-lg rounded-full">

                <div
                    className="
    absolute top-1 bottom-1  rounded-full bg-white/10
    shadow-[0_2px_8px_rgba(0,0,0,0.12)]
    transition-all duration-300 ease-in-out
  "
                    style={{
                        width: "calc((100% - 8px) / 3)",
                        transform:
                            activeTab === "all"
                                ? "translateX(0%)"
                                : activeTab === "my"
                                    ? "translateX(100%)"
                                    : "translateX(200%)",
                    }}
                />

                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`
      relative z-10 px-5 py-2 text-sm font-medium rounded-full
      transition-all duration-200
      ${activeTab === tab.key
                                ? "text-black/90 scale-105"
                                : "text-black/50 hover:text-black/70"
                            }
    `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {activeTab === "all" && <p>All Tasks</p>}
                {activeTab === "my" && <p>My Tasks</p>}
                {activeTab === "archived" && <p>Archived Tasks</p>}
            </div>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Add Task"
            >
                <div className="space-y-5 max-w-4xl mx-auto">

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <Dropdown
                                options={[
                                    { label: "Project 1", value: "project1" },
                                    { label: "Project 2", value: "project2" },
                                    { label: "Project 3", value: "project3" },
                                ]}
                                placeholder="Select project"
                                value={project}
                                onChange={(value) => setProject(value)}
                            />
                        </div>


                        <div>
                            <Dropdown
                                options={[
                                    { label: "Low   ", value: "low" },
                                    { label: "Medium", value: "medium" },
                                    { label: "High", value: "high" },
                                ]}
                                placeholder="Select priority"
                                value={priority}
                                onChange={(value) => setPriority(value)}

                            />
                        </div>

                        <div>
                            <Dropdown
                                options={[
                                    { label: "Employee 1", value: "employee1" },
                                    { label: "Employee 2", value: "employee2" },
                                    { label: "Employee 3", value: "employee3" },
                                ]}
                                placeholder="Select employee"
                                value={assignTo}
                                onChange={(value) => setAssignTo(value)}
                            />
                        </div>
                    </div>

                    <div>
                        <Input
                            type="textarea"
                            label="Task Name"
                            placeholder="Enter task name"
                            onChange={(e) => setTaskName(e.target.value)}
                            error={taskNameError}
                            onBlur={() => {
                                if (!taskName) setTaskNameError("Task name is required");
                                else setTaskNameError("");
                            }}
                        />
                    </div>



                    <div className="flex justify-end gap-2 ">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="px-4 py-2 rounded-lg border text-gray-600 hover:bg-gray-100"
                        >
                            Cancel
                        </button>

                        <button className="px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700">
                            Save Task
                        </button>
                    </div>

                </div>
            </Modal>
        </div>
    );
};

export default TasksTabs;