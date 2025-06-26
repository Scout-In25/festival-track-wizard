import React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import axios from "axios"

const schema = z.object({
  interests: z.array(z.string()).nonempty("Select at least one interest."),
  musicStyle: z.string().min(1, "Select a music style."),
  sundayOption: z.string().min(1, "Choose a Sunday event.")
})

export default function Wizard() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      interests: [],
      musicStyle: "",
      sundayOption: ""
    }
  })

  const onSubmit = async (data) => {
    try {
      await axios.post("https://si25.nl/REST/formsubmit/", data)
      alert("Schedule submitted!")
    } catch (err) {
      alert("Submission failed.")
      console.error(err)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto p-4 bg-white rounded-xl shadow space-y-4">
      <h2 className="text-2xl font-bold">Festival Track Wizard</h2>
      <fieldset>
        <legend className="font-semibold">Your Interests</legend>
        <label><input type="checkbox" value="Music" {...register("interests")} /> Music</label><br />
        <label><input type="checkbox" value="Workshops" {...register("interests")} /> Workshops</label><br />
        {errors.interests && <p className="text-red-500">{errors.interests.message}</p>}
      </fieldset>
      <div>
        <label htmlFor="musicStyle" className="block font-semibold">Music Style</label>
        <select id="musicStyle" {...register("musicStyle")} className="border p-1 rounded w-full">
          <option value="">-- Select --</option>
          <option value="rock">Rock</option>
          <option value="electronic">Electronic</option>
          <option value="folk">Folk</option>
        </select>
        {errors.musicStyle && <p className="text-red-500">{errors.musicStyle.message}</p>}
      </div>
      <fieldset>
        <legend className="font-semibold">Special Sunday Event</legend>
        <label><input type="radio" value="Yoga" {...register("sundayOption")} /> Yoga</label><br />
        <label><input type="radio" value="Startup Brunch" {...register("sundayOption")} /> Startup Brunch</label><br />
        {errors.sundayOption && <p className="text-red-500">{errors.sundayOption.message}</p>}
      </fieldset>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit</button>
    </form>
  )
}
