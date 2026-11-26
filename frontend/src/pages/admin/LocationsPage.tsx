import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCreateLocation,
  useLocations,
  useUpdateLocation,
} from "@/features/locations/api";
import type { LocationResponse, LocationType } from "@/types/location";

const locationSchema = z.object({
  name: z.string().min(1, "Required"),
  type: z.enum(["WAREHOUSE", "SHOP"]),
  address: z.string().optional(),
});

type LocationForm = z.infer<typeof locationSchema>;

function LocationFormDialog({
  location,
  trigger,
}: {
  location?: LocationResponse;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LocationForm>({
    resolver: zodResolver(locationSchema),
    defaultValues: location
      ? { name: location.name, type: location.type, address: location.address ?? "" }
      : { type: "SHOP" },
  });

  async function onSubmit(values: LocationForm) {
    if (location) {
      await updateLocation.mutateAsync({
        id: location.id,
        name: values.name,
        type: values.type,
        address: values.address,
        active: location.active,
      });
    } else {
      await createLocation.mutateAsync({
        name: values.name,
        type: values.type,
        address: values.address,
        active: true,
      });
    }
    reset();
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          reset(
            location
              ? { name: location.name, type: location.type, address: location.address ?? "" }
              : { type: "SHOP" },
          );
        }
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? "Edit location" : "Add location"}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="location-name">Name</Label>
            <Input id="location-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={watch("type")}
              onValueChange={(value) => setValue("type", value as LocationType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WAREHOUSE">Warehouse</SelectItem>
                <SelectItem value="SHOP">Shop</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-address">Address (optional)</Label>
            <Input id="location-address" {...register("address")} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : location ? "Save changes" : "Create location"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LocationsPage() {
  const { data: locations, isLoading } = useLocations();
  const updateLocation = useUpdateLocation();

  function toggleActive(location: LocationResponse) {
    updateLocation.mutate({
      id: location.id,
      name: location.name,
      type: location.type,
      address: location.address ?? undefined,
      active: !location.active,
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Locations</CardTitle>
        <LocationFormDialog trigger={<Button>Add location</Button>} />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {locations?.map((location) => (
              <TableRow key={location.id}>
                <TableCell className="font-medium">{location.name}</TableCell>
                <TableCell>{location.type}</TableCell>
                <TableCell>{location.address ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={location.active ? "default" : "secondary"}>
                    {location.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <LocationFormDialog
                    location={location}
                    trigger={
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    }
                  />
                  <Button variant="outline" size="sm" onClick={() => toggleActive(location)}>
                    {location.active ? "Deactivate" : "Activate"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
