import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "../UI/Model";
import Button from "../UI/Button";
import Input from "../UI/Input";
import { useCreateApplicant } from "../../apis/api/hiring";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function CreateApplicantModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [expectedSalary, setExpectedSalary] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");
  const [linkedIn, setLinkedIn] = useState("");
  const [github, setGithub] = useState("");
  const [note, setNote] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const create = useCreateApplicant();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) {
      toast.error("Name, email, and phone are required");
      return;
    }
    if (!resume) { toast.error("Resume file is required"); return; }

    try {
      await create.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        resume,
        experience: experience || undefined,
        skills: skills || undefined,
        expectedSalary: expectedSalary ? Number(expectedSalary) : undefined,
        currentSalary: currentSalary ? Number(currentSalary) : undefined,
        noticePeriod: noticePeriod || undefined,
        linkedInProfile: linkedIn || undefined,
        gitHubLink: github || undefined,
        note: note || undefined,
      });
      toast.success("Applicant added");
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Applicant" panelClassName="max-w-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Basic */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Full name *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Email *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Phone *</label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Experience</label>
            <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="3 years" />
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Skills <span className="text-slate-400">(comma separated)</span></label>
          <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Node.js, TypeScript" />
        </div>

        {/* Salary + notice */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Current salary</label>
            <Input type="number" value={currentSalary} onChange={(e) => setCurrentSalary(e.target.value)} placeholder="600000" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expected salary</label>
            <Input type="number" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} placeholder="900000" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notice period</label>
            <Input value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} placeholder="30 days" />
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">LinkedIn</label>
            <Input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/…" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">GitHub</label>
            <Input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/…" />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Note</label>
          <Input type="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Internal notes…" rows={2} />
        </div>

        {/* Resume */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Resume *</label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={(e) => setResume(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 px-4 py-3 text-sm text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-colors"
          >
            <Upload className="h-4 w-4" />
            {resume ? resume.name : "Click to upload resume (PDF / DOC)"}
          </button>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={create.isPending}>
            {create.isPending ? "Adding…" : "Add applicant"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
