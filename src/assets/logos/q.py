import os

# Get the current directory
current_dir = os.getcwd()

# Iterate over all folders in the directory
for folder_name in os.listdir(current_dir):
    old_path = os.path.join(current_dir, folder_name)

    # Check if it's a directory (not a file)
    if os.path.isdir(old_path):
        # Convert to lowercase and remove spaces
        new_name = folder_name.lower().replace(" ", "")
        new_path = os.path.join(current_dir, new_name)

        # Rename only if the new name is different
        if old_path != new_path:
            os.rename(old_path, new_path)
            print(f"Renamed: '{folder_name}' → '{new_name}'")

print("✅ Folder renaming completed!")
